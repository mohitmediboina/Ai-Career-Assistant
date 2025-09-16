// routes/conversationRoutes.js
import express from "express";
import Conversation from "../models/Conversation.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Create new conversation
router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const convo = await Conversation.create({ userId, messages: [] });
    res.json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add this new route to generate titles
router.post("/generate_title", async (req, res) => {
  try {
    const { messages, convoId } = req.body;

    // Generate title using the first few messages
    const prompt = `Generate a short, concise title (maximum 40 characters) for this conversation. First message: ${messages[0]?.content}`;
    
    const FASTAPI_URL = "http://localhost:8000/title";
    // Use your AI model to generate title (similar to how you handle chat responses)
    const aiResponse = await fetch(FASTAPI_URL,{
      method:"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    })

    

    

    const result = await aiResponse.json()
    
    // Update conversation with new title
    await Conversation.findByIdAndUpdate(convoId, { title: result.title});

    res.json({ title: result.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate title" });
  }
});


router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const convos = await Conversation.find({ userId })
      .sort({ updatedAt: -1 }) // Sort by most recent first
      .select('_id title updatedAt'); // Only select needed fields
    
    const convoList = convos.map(conv => ({
      id: conv._id,
      title: conv.title || "New Chat",
      updatedAt: conv.updatedAt
    }));

    res.json(convoList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});




// Get single conversation
router.get("/single/:convoId", async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.convoId);
    if (!convo) return res.status(404).json({ error: "Conversation not found" });
    res.json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// Delete single conversation
router.delete("/:convoId", async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.convoId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete all conversations for a user
router.delete("/user/:userId", async (req, res) => {
  try {
    await Conversation.deleteMany({ userId: req.params.userId });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
