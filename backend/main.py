from typing import TypedDict, Annotated
from langgraph.graph import add_messages, StateGraph, END, START
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage
from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
from fastapi import Body
from pydantic import BaseModel
from typing import List
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage



load_dotenv()

# State definition
class State(TypedDict):
    messages: Annotated[list, add_messages]

# Tools
search_tool = TavilySearchResults(max_results=4)
tools = [search_tool]

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

    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]

        if tool_name == "tavily_search_results_json":
            search_results = await search_tool.ainvoke(tool_args)
            tool_message = ToolMessage(
                content=str(search_results),
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
    content:str

class ChatRequest(BaseModel):
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
    print(converted)
    return converted


# Streaming generator
async def generate_chat_responses(messages: list):
    events = graph.astream_events(
        {"messages": messages},
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

            if search_calls:
                search_query = search_calls[0]["args"].get("query", "")
                yield f"data: {safe_json_encode({'type': 'search_start', 'query': search_query})}\n\n"

        elif event_type == "on_tool_end" and event["name"] == "tavily_search_results_json":
            output = event["data"]["output"]
            if isinstance(output, list):
                urls = [item["url"] for item in output if isinstance(item, dict) and "url" in item]
                yield f"data: {safe_json_encode({'type': 'search_results', 'urls': urls})}\n\n"

    yield f"data: {safe_json_encode({'type': 'end'})}\n\n"

# Endpoint
@app.post("/chat_stream")
async def chat_stream(request:ChatRequest):

    langchain_msgs = to_langchain_messages(request.messages)


    return StreamingResponse(
        generate_chat_responses(langchain_msgs),
        media_type="text/event-stream",
       
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
