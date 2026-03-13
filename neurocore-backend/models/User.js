import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, default: "Anonymous" },
  email: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  totalSessions: { type: Number, default: 0 },
  classroomCode: { type: String, default: null },
  baselineProfile: {
    avgReadingSpeed:             { type: Number, default: 0 },
    avgFocusDuration:            { type: Number, default: 0 },
    fatigueSensitivityScore:     { type: Number, default: 0 },
    distractionSensitivityScore: { type: Number, default: 0 },
    preferredChunkSize:          { type: Number, default: 2 },
    audioPreference:             { type: Boolean, default: false },
    avgRereadDensity:            { type: Number, default: 0 },
    dominantRhythm:              { type: String, default: "steady" },
  },
});

export default mongoose.model("User", userSchema);