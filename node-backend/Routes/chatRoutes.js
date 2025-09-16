import express from "express";
import fetch from "node-fetch";
import Conversation from "../models/Conversation.js"; // adjust path
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


const router = express.Router();
const FASTAPI_URL = `${process.env.FASTAPI_URL}/chat_stream`;


// router.post("/", async (req, res) => {
//   try {
//     const authHeaders = req.headers.authorization;
//     const { userId, convoId, message } = req.body;
//     console.log(userId, convoId, message, authHeaders);
//     if (!userId || !convoId || !message || !authHeaders || !authHeaders.startsWith("Bearer ")) {
//       return res
//         .status(400)
//         .json({ error: "Unrestricted" });
//     }

//     const token = authHeaders.split(' ')[1];

//     const decoded = jwt.verify(token, process.env.JWT_SECRET)
//     if(!decoded){
//         return res.status(400).json({error:"Failed"})
//     }
//     console.log(decoded);
//     // Find conversation
//     const convo = await Conversation.findOne({ _id: convoId, userId });
//     if (!convo) return res.status(404).json({ error: "Conversation not found" });

//     // Append user message
//     convo.messages.push({ role: "user", content: message });
//     await convo.save();

//     // Setup SSE response
//     res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
//     res.setHeader("Cache-Control", "no-cache, no-transform");
//     res.setHeader("Connection", "keep-alive");

//     // Forward all messages to FastAPI
//     const response = await fetch(FASTAPI_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ messages: convo.messages }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       res.write(`data: ${JSON.stringify({ error: errorText })}\n\n`);
//       return res.end();
//     }

//     let aiMessage = "";

//     // Read streaming chunks line by line
//     for await (const chunk of response.body) {
//       const lines = chunk.toString().split("\n");

//       for (const line of lines) {
//         if (line.startsWith("data: ")) {
//           const dataStr = line.replace("data: ", "").trim();
//           if (!dataStr) continue;

//           const parsed = JSON.parse(dataStr);

//           if (parsed.type === "content") {
//             aiMessage += parsed.content;
//             res.write(`data: ${JSON.stringify({ token: parsed.content })}\n\n`);
//           } else if (parsed.type === "search_start") {
//             res.write(`data: ${JSON.stringify({ search: parsed.query })}\n\n`);
//           } else if (parsed.type === "search_results") {
//             res.write(`data: ${JSON.stringify({ urls: parsed.urls })}\n\n`);
//           } else if (parsed.type === "end") {
//             // Save full AI response in DB
//             convo.messages.push({ role: "assistant", content: aiMessage });
//             await convo.save();
//             res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
//             res.end();
//           }
//         }
//       }
//     }
//   } catch (err) {
//     console.error("Chat error:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "Internal Server Error" });
//     } else {
//       res.end();
//     }
//   }
// });

router.post("/", async (req, res) => {
  try {
    const authHeaders = req.headers.authorization;
    const { userId, convoId, message } = req.body;

    if (!userId || !convoId || !message || !authHeaders?.startsWith("Bearer ")) {
      return res.status(400).json({ error: "Unrestricted" });
    }

    const token = authHeaders.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(400).json({ error: "Failed" });

    // find conversation
    // const convo = await Conversation.findOne({ _id: convoId, userId });
    // console.log(convo);
    const convo = await Conversation.findOneAndUpdate(
      { _id: convoId, userId },
      { 
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );
    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    // push user message first
    convo.messages.push({ role: "user", content: message });
    await convo.save();

    // setup SSE headers
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // forward to FastAPI
    const response = await fetch(FASTAPI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: convo.messages }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.write(`data: ${JSON.stringify({ error: errorText })}\n\n`);
      return res.end();
    }

    let aiMessage = "";

    for await (const chunk of response.body) {
      const str = chunk.toString();

      // proxy raw event to frontend
      res.write(str);
      res.flush?.();

      // also check if it's content or end
      for (const line of str.split("\n")) {
        if (line.startsWith("data: ")) {
          const parsed = JSON.parse(line.replace("data: ", "").trim());

          if (parsed.type === "content") {
            aiMessage += parsed.content; // accumulate
          } else if (parsed.type === "end") {
            // when AI finishes → save to DB
            convo.messages.push({ role: "assistant", content: aiMessage });
            await convo.save();
            res.end();
          }
        }
      }
    }
  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.end();
    }
  }
});


export default router;
