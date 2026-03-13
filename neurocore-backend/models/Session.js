import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  contentPreview: { type: String, maxlength: 200 },
  startTime: Date,
  endTime: Date,
  chunkSize: { type: Number, default: 2 },
  attentionDrops: Number,
  fatigueScore: Number,
  sessionSummary: Object,
});

export default mongoose.model("Session", sessionSchema);