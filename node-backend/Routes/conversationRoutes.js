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

// List all conversations for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const convos = await Conversation.find({ userId }).sort({ createdAt: -1 });
    const messageIds = [];
    for (const conv of convos) {
      messageIds.push(conv._id);
    }
    res.json(messageIds);
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
