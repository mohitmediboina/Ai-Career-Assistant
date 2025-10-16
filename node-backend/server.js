import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Routes
import userRoutes from "./Routes/userRoutes.js";
import conversationRoutes from "./Routes/conversationRoutes.js";
import chatRoutes from "./Routes/chatRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON bodies

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/users", userRoutes); // register, login
app.use("/conversations", conversationRoutes); // create convo, list, delete
app.use("/chat", chatRoutes); // send user message, stream AI
app.use("/profile", profileRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

