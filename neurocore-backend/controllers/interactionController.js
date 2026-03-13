import ChunkInteraction from "../models/ChunkInteraction.js";
import { analyzeRealtime } from "../services/realtimeEngine.js";

export const logInteraction = async (req, res) => {
  try {
    const interaction = await ChunkInteraction.create({
      sessionId:       req.body.sessionId,
      chunkIndex:      req.body.chunkIndex,
      timeSpent:       req.body.timeSpent,
      scrollVelocity:  req.body.scrollVelocity,
      rereadCount:     req.body.rereadCount,
      hesitationEvents:req.body.hesitationEvents,
      microPauses:     req.body.microPauses,
      focusLostEvents: req.body.focusLostEvents,
    });

    // Fetch all interactions for this session and run realtime analysis
    const allInteractions = await ChunkInteraction.find({
      sessionId: req.body.sessionId
    }).sort({ createdAt: 1 });

    const realtimeSignal = analyzeRealtime(allInteractions);

    res.status(201).json({ interaction, realtimeSignal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSessionInteractions = async (req, res) => {
  try {
    const interactions = await ChunkInteraction.find({
      sessionId: req.params.id
    });
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};