from typing import TypedDict, Annotated
from langgraph.graph import add_messages, StateGraph, END, START
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage
from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
from fastapi import Body
from pydantic import BaseModel
from typing import List
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import asyncio
import motor_db
from bson import ObjectId
from langchain_core.tools import tool
import ast  # for safe list parsing if needed

load_dotenv()

# State definition
class State(TypedDict):
    userId: str
    messages: Annotated[list, add_messages]

# Tools
search_tool = TavilySearchResults(max_results=4)

@tool
async def update_user_profile(field: str, value: str, user_id: str) -> str:
    """Update the user's profile field with the given field and value. Use this when the user mentions an update to their profile, like getting a new job or changing skills. For skills, provide value as a comma-separated string e.g., 'Python, JavaScript, SQL'."""
    if motor_db.db is None:
        return "Database not available for update."
    
    update_dict = {"$set": {}}
    if field == "skills":
        # Parse comma-separated skills into list
        skills_list = [skill.strip() for skill in value.split(",") if skill.strip()]
        update_dict["$set"][f"profile.{field}"] = skills_list
    else:
        # For other fields like name, resume: treat as string
        update_dict["$set"][f"profile.{field}"] = value
    
    # Update MongoDB
    update_result = await motor_db.db["users"].update_one(
        {"_id": ObjectId(user_id)},
        update_dict
    )
    if update_result.modified_count > 0:
        return f"Successfully updated profile field '{field}'."
    else:
        return f"Failed to update profile field '{field}'. User not found or no changes."

tools = [search_tool, update_user_profile]

# LLM
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
llm_with_tools = llm.bind_tools(tools=tools)

# Model node
async def model(state: State):
    result = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [result]}

# Router node
async def tools_router(state: State):
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tool_node"
    else:
        return END

# Tool node
async def tool_node(state):
    tool_calls = state["messages"][-1].tool_calls
    tool_messages = []
    user_id = state["userId"]

    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]

        if tool_name == "tavily_search_results_json":
            tool_result = await search_tool.ainvoke(tool_args)
            tool_message = ToolMessage(
                content=str(tool_result),
                tool_call_id=tool_id,
                name=tool_name
            )
            tool_messages.append(tool_message)
        elif tool_name == "update_user_profile":
            # Add user_id to args for the tool
            tool_args_with_user = {**tool_args, "user_id": user_id}
            tool_result = await update_user_profile.ainvoke(tool_args_with_user)
            tool_message = ToolMessage(
                content=str(tool_result),
                tool_call_id=tool_id,
                name=tool_name
            )
            tool_messages.append(tool_message)

    return {"messages": tool_messages}

# Graph
graph_builder = StateGraph(State)
graph_builder.add_node("model", model)
graph_builder.add_node("tool_node", tool_node)
graph_builder.set_entry_point("model")
graph_builder.add_conditional_edges("model", tools_router)
graph_builder.add_edge("tool_node", "model")
graph = graph_builder.compile()

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type"],
)

# Utils
@app.on_event("startup")
async def startup_event():
    await motor_db.connect_to_mongo()

@app.get("/all_users")
async def get_all_users():
    if motor_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    users_cursor = motor_db.db["users"].find({})
    users = []
    async for user in users_cursor:
        user["_id"] = str(user["_id"])
        users.append(user)
    return {"users": users}

def serialise_ai_message_chunk(chunk):
    if isinstance(chunk, AIMessageChunk):
        return chunk.content
    else:
        raise TypeError(
            f"Object of type {type(chunk).__name__} is not correctly formatted for serialisation"
        )

def safe_json_encode(data):
    return json.dumps(data, ensure_ascii=False)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    userId: str
    messages: List[Message]

def to_langchain_messages(messages: list[Message]):
    converted = []
    for msg in messages:
        if msg.role == "user":
            converted.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            converted.append(AIMessage(content=msg.content))
        elif msg.role == "system":
            converted.append(SystemMessage(content=msg.content))
        else:
            raise ValueError(f"Unsupported role: {msg.role}")
        
    return converted

# Streaming generator
async def generate_chat_responses(messages: list, userId: str):
    events = graph.astream_events(
        {"messages": messages, "userId": userId},
        version="v2",
    )

    async for event in events:
        event_type = event["event"]

        if event_type == "on_chat_model_stream":
            chunk_content = serialise_ai_message_chunk(event["data"]["chunk"])
            yield f"data: {safe_json_encode({'type': 'content', 'content': chunk_content})}\n\n"

        elif event_type == "on_chat_model_end":
            tool_calls = (
                event["data"]["output"].tool_calls
                if hasattr(event["data"]["output"], "tool_calls")
                else []
            )
            search_calls = [call for call in tool_calls if call["name"] == "tavily_search_results_json"]
            update_calls = [call for call in tool_calls if call["name"] == "update_user_profile"]

            if search_calls:
                search_query = search_calls[0]["args"].get("query", "")
                yield f"data: {safe_json_encode({'type': 'search_start', 'query': search_query})}\n\n"

            if update_calls:
                field = update_calls[0]["args"].get("field", "")
                value = update_calls[0]["args"].get("value", "")
                yield f"data: {safe_json_encode({'type': 'profile_update', 'field': field, 'value': value})}\n\n"

        elif event_type == "on_tool_end" and event["name"] == "tavily_search_results_json":
            output = event["data"]["output"]
            if isinstance(output, list):
                urls = [item["url"] for item in output if isinstance(item, dict) and "url" in item]
                yield f"data: {safe_json_encode({'type': 'search_results', 'urls': urls})}\n\n"

        elif event_type == "on_tool_end" and event["name"] == "update_user_profile":
            output = event["data"]["output"]
            yield f"data: {safe_json_encode({'type': 'profile_update_result', 'result': output})}\n\n"

    yield f"data: {safe_json_encode({'type': 'end'})}\n\n"

# Endpoint
@app.post("/chat_stream")
async def chat_stream(request: ChatRequest):

    langchain_msgs = to_langchain_messages(request.messages)
    
    user_id = request.userId

    return StreamingResponse(
        generate_chat_responses(langchain_msgs, user_id),
        media_type="text/event-stream",
    )

class TitleRequest(BaseModel):
    messages: List[Message]

@app.post("/title")
async def generate_title(request: TitleRequest):
    try:
        messages = to_langchain_messages(request.messages)
        
        # Add system message for title generation
        system_message = SystemMessage(content="""
        Generate a very concise title (4-5 words maximum) that captures the main topic of the conversation.
        Respond with ONLY the title, nothing else.
        Make it clear and descriptive.
        """)
        
        # Get first user message for context
        first_message = messages[0].content if messages else ""
        human_message = HumanMessage(content=f"Generate title for: {first_message}")
        
        # Get title from LLM
        messages_for_title = [system_message, human_message]
        title_response = await llm.ainvoke(messages_for_title)
        
        # Clean up the title (remove quotes, newlines, etc)
        clean_title = title_response.content.strip('" \n').strip()
        
        # Ensure title length
        if len(clean_title.split()) > 5:
            clean_title = " ".join(clean_title.split()[:5])
            

        
        return {"title": clean_title}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)