import mongoose from "mongoose";

const chunkInteractionSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session"
  },
  chunkIndex: Number,
  timeSpent: Number,
  scrollVelocity: Number,
  rereadCount: Number,
  hesitationEvents: Number,
  microPauses: Number,
  focusLostEvents: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("ChunkInteraction", chunkInteractionSchema);