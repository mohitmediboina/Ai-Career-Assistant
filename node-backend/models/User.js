import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // hashed password
  profile: {
    name: { type: String },
    skills: [{ type: String }],
    resume: { type: String },
    // Add more fields as needed, e.g., education: [{ type: String }], experience: [{ type: Object }]
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);