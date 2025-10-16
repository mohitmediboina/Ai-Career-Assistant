

export const BASE_API_URL = "http://localhost:5000"


// api/user.js
const API_URL = "http://localhost:5000/profile";

// Get Profile
export async function getProfile(token) {
  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Update Profile (full)
export async function updateProfile(token, data) {
  const res = await fetch(`${API_URL}/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Partial Update
export async function patchProfile(token, data) {
  const res = await fetch(`${API_URL}/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}


//Register 
export async function register({email, password}) {
  try {
    const res = await fetch(`${BASE_API_URL}/users/register`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email, password})
    })
  

    return await res.json();
    
  } catch (error) {
     return {"error":error}
  }
    
}

//Login
export async function login({email, password}) {
  try {
    const res = await fetch(`${BASE_API_URL}/users/login`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email, password})
    })    
    console.log(res, BASE_API_URL)
    return await res.json()
    
  } catch (error) {

    return {"error":error}
  }
    
}

//create conversation
export async function createConversation({userId}) {
  try {
    const res = await fetch(`${BASE_API_URL}/conversations`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({userId})
    })

    return await res.json()
  } catch (error) {
     return {"error":error}
  }
    
}

// list convos
export async function listConversations({ userId}) {
  const res = await fetch(`${BASE_API_URL}/conversations/${userId}`);
  return res.json();
}

// Add this new function
export async function generateTitle({ messages, convoId }) {
  try {
    console.log("from gen tit ",convoId);
    const res = await fetch(`${BASE_API_URL}/conversations/generate_title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, convoId })
    });
  
    return await res.json();
  } catch (error) {
    console.error("Error generating title:", error);
    return { error };
  }
}

// get convo
export async function getConversation({ convoId }) {
  const res = await fetch(`${BASE_API_URL}/conversations/single/${convoId}`);
  return res.json();
}

// Stream chat response
export async function streamChat({ userId, convoId, message, token, onEvent }) {
  const res = await fetch(`${BASE_API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ userId, convoId, message }),
  });

  if (!res.ok) throw new Error(await res.text());

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const dataLines = block
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.replace(/^data:\s?/, ""));

      if (dataLines.length === 0) continue;

      const jsonStr = dataLines.join("\n").trim();
      if (!jsonStr) continue;

      try {
        const ev = JSON.parse(jsonStr);
        onEvent(ev); // send parsed event to UI
      } catch (e) {
        console.warn("parse error", jsonStr, e);
      }
    }
  }
}