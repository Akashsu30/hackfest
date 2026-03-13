import Session from "../models/Session.js";
import { computeMetrics } from "../services/cognitiveEngine.js";
import { updateUserProfile } from "../services/profileEngine.js";

export const startSession = async (req, res) => {
  try {
    const session = await Session.create({
      userId: req.body.userId ?? null,
      contentPreview: req.body.content?.slice(0, 200) ?? "",
      startTime: new Date(),
      chunkSize: req.body.chunkSize ?? 2,
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { endTime: new Date() },
      { returnDocument: "after" }
    );
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Auto-update user profile if session has a userId
    if (session.userId) {
      const metrics = await computeMetrics(req.params.id);
      if (metrics) {
        await updateUserProfile(session.userId, metrics, {
          chunkSize: session.chunkSize,
        });
      }
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};