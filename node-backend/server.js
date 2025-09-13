import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Routes
import userRoutes from "./Routes/userRoutes.js";
import conversationRoutes from "./Routes/conversationRoutes.js";
import chatRoutes from "./Routes/chatRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON bodies

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/chatgpt_clone";
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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// const FASTAPI_URL = "http://localhost:8000/chat_stream";

// app.post("/chat", async (req, res) => {
//   try {
//     const { messages } = req.body;
//     if (!messages) {
//       return res.status(400).json({ error: "messages field is required" });
//     }

//     // Setup SSE response
//     res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
//     res.setHeader("Cache-Control", "no-cache, no-transform");
//     res.setHeader("Connection", "keep-alive");

//     // Forward request to FastAPI
//     const response = await fetch(FASTAPI_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ messages }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       res.write(`data: ${JSON.stringify({ error: errorText })}\n\n`);
//       return res.end();
//     }

//     // Pipe FastAPI stream → Node → React
//     response.body.on("data", (chunk) => {
//       res.write(chunk.toString()); // forward directly
//     });

//     response.body.on("end", () => {
//       res.end();
//     });

//     response.body.on("error", (err) => {
//       console.error("Stream error:", err);
//       res.end();
//     });
//   } catch (err) {
//     console.error("Node proxy error:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// });