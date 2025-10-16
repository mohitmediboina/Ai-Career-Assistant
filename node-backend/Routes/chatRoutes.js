import express from "express";
import fetch from "node-fetch";
import Conversation from "../models/Conversation.js"; // adjust path
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
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

// router.post("/", async (req, res) => {
//   try {
//     const authHeaders = req.headers.authorization;
//     const { userId, convoId, message } = req.body;

//     if (
//       !userId ||
//       !convoId ||
//       !message ||
//       !authHeaders?.startsWith("Bearer ")
//     ) {
//       return res.status(400).json({ error: "Unrestricted" });
//     }

//     const token = authHeaders.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decoded) return res.status(400).json({ error: "Failed" });

//     // find conversation
//     // const convo = await Conversation.findOne({ _id: convoId, userId });
//     // console.log(convo);
//     const convo = await Conversation.findOneAndUpdate(
//       { _id: convoId, userId },
//       {
//         $set: { updatedAt: new Date() },
//       },
//       { new: true }
//     );
//     if (!convo)
//       return res.status(404).json({ error: "Conversation not found" });

//     try {
//       const user = await User.findById(userId);
//       if (!user) {
//         console.log("User not found.");
//         return;
//       }

//       const profile = user.profile;
//       const userName = profile.name || "User";
//       const userSkills = profile.skills?.join(", ") || "Not specified";
//       const userResume = profile.resume || "Resume not provided";

//       // Define the system behavior for your AI
//       const systemPrompt = `
//             You are a personalized AI Career Assistant.
//             Use the user's profile information to give career guidance, resume improvement tips, and job search insights.

//             Follow these rules:
//             1. Always tailor responses to the user's skills, goals, and background.
//             2. Give concise, practical, and actionable advice.
//             3. Never repeat the profile back verbatim; use it as context.
//             4. Keep tone professional and friendly.

//             User Profile:
//             - Name: ${userName}
//             - Skills: ${userSkills}
//             - Resume Summary: ${userResume}
//             `;

//       // Check if this is the first message in conversation
//       if (convo.messages.length === 0) {
//         // Add system prompt + user's first message
//         convo.messages.push(
//           { role: "system", content: systemPrompt },
//           { role: "user", content: message }
//         );
//       } else {
//         // Normal message for subsequent turns
//         convo.messages.push({ role: "user", content: message });
//       }

//       await convo.save();

//       console.log("Message added with context:", message);
//     } catch (error) {
//       console.error("Error handling message:", error);
//     }

//     // setup SSE headers
//     res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
//     res.setHeader("Cache-Control", "no-cache, no-transform");
//     res.setHeader("Connection", "keep-alive");
//     res.flushHeaders?.();

//     // forward to FastAPI
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

//     for await (const chunk of response.body) {
//       const str = chunk.toString();

//       // proxy raw event to frontend
//       res.write(str);
//       res.flush?.();

//       // also check if it's content or end
//       for (const line of str.split("\n")) {
//         if (line.startsWith("data: ")) {
//           const parsed = JSON.parse(line.replace("data: ", "").trim());

//           if (parsed.type === "content") {
//             aiMessage += parsed.content; // accumulate
//           } else if (parsed.type === "end") {
//             // when AI finishes → save to DB
//             convo.messages.push({ role: "assistant", content: aiMessage });
//             await convo.save();
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

    if (
      !userId ||
      !convoId ||
      !message ||
      !authHeaders?.startsWith("Bearer ")
    ) {
      return res.status(400).json({ error: "Unrestricted" });
    }

    const token = authHeaders.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(400).json({ error: "Failed" });

    // find conversation
    const convo = await Conversation.findOneAndUpdate(
      { _id: convoId, userId },
      {
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );
    if (!convo)
      return res.status(404).json({ error: "Conversation not found" });

    try {
      const user = await User.findById(userId);
      if (!user) {
        console.log("User not found.");
        return;
      }

      const profile = user.profile;
      const userName = profile.name || "User";
      const userSkills = profile.skills?.join(", ") || "Not specified";
      const userResume = profile.resume || "Resume not provided";

      // Enhanced system prompt for AI Career Assistant with onboarding and tool usage
      const systemPrompt = ` Make this conversation like human to an experienced career assistant with more then 10 years of experience.
You are a personalized AI Career Assistant. You also have search tools use tavily search tool to get the latest information and jobs links from the internet.
Use the user's profile information to give career guidance, resume improvement tips, and job search insights and you can also update user information in the db while conversation with the person to make it have a uptodate context .

Follow these rules:
1. Always tailor responses to the user's skills, goals, background and must give him the right advices and give a future proof skills learning recommendation.asking like a real career assistant with more then 15 year of experience .make sure don't look like robotic make it a real human like feel conversation the user must get insights even if the user is not so much intrested to study make him feel good about study and give a ideas and roadmaps and resources to him
2. Give concise, practical, and actionable advice.
3. Never repeat the profile back verbatim; use it as context.
4. Keep tone professional and friendly.
5. You have access to the update_user_profile tool to update the user's profile based on information they provide. Use it whenever the user shares new details about their name, skills (provide as comma-separated list), resume, etc. For skills, format the value as a comma-separated string like "Python, JavaScript, SQL".
6. If this is the start of a new conversation (first message) and key profile fields are missing or "Not specified" (like name, skills, resume), proactively ask the user to provide the missing information to build a better personalized experience. Once they provide it, confirm and use the update_user_profile tool to save it.

User Profile:
- Name: ${userName}
- Skills: ${userSkills}
- Resume Summary: ${userResume}
`;

      // Check if this is the first message in conversation
      if (convo.messages.length === 0) {
        // Add system prompt + user's first message
        convo.messages.push(
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        );
      } else {
        // Normal message for subsequent turns
        convo.messages.push({ role: "user", content: message });
      }

      await convo.save();

      console.log("Message added with context:", message);
    } catch (error) {
      console.error("Error handling message:", error);
    }

    // setup SSE headers
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // forward to FastAPI with userId
    const response = await fetch(FASTAPI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, messages: convo.messages }),
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
