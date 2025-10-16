import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟩 Get logged-in user's profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🟨 Update entire profile (PUT)
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { name, skills, resume } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { profile: { name, skills, resume } },
      { new: true }
    ).select("-passwordHash");

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🟦 Partially update fields (PATCH)
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const updateFields = {};
    for (const key in req.body) {
      if (req.body[key] !== undefined) {
        updateFields[`profile.${key}`] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true }
    ).select("-passwordHash");

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🟥 Delete account (optional)
router.delete("/me", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
