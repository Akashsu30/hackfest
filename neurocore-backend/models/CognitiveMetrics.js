import mongoose from "mongoose";

const cognitiveMetricsSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session"
  },
  avgChunkTime: Number,
  varianceInReadingSpeed: Number,
  rereadDensity: Number,
  distractionIndex: Number,
  fatigueIndex: Number,
  rhythmPattern: String
});

export default mongoose.model("CognitiveMetrics", cognitiveMetricsSchema);