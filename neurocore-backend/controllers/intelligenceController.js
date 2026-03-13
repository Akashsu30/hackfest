import {
  predictReadingDifficulty,
  estimateCognitiveLoad,
  predictAttentionDrift,
  generatePacingSuggestion,
} from "../services/cognitiveIntelligence.js";
import ChunkInteraction from "../models/ChunkInteraction.js";
import { computeMetrics } from "../services/cognitiveEngine.js";

export const analyzeTextDifficulty = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });
    const result = await predictReadingDifficulty(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const analyzeChunkLoad = async (req, res) => {
  try {
    const { chunks } = req.body;
    if (!chunks?.length) return res.status(400).json({ error: "Chunks required" });
    const result = await estimateCognitiveLoad(chunks);
    res.json({ chunkLoads: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDriftPrediction = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const interactions = await ChunkInteraction.find({ sessionId }).sort({ createdAt: 1 });

    if (interactions.length < 3) {
      return res.json({ driftRisk: 0, predictedDriftIn: null, reason: "Not enough data yet.", recommendation: "Keep reading." });
    }

    const recent = interactions.slice(-5);
    const recentMetrics = {
      avgTimeSpent: recent.reduce((s, i) => s + i.timeSpent, 0) / recent.length,
      avgMicroPauses: recent.reduce((s, i) => s + i.microPauses, 0) / recent.length,
      avgFocusLost: recent.reduce((s, i) => s + i.focusLostEvents, 0) / recent.length,
      avgRereads: recent.reduce((s, i) => s + i.rereadCount, 0) / recent.length,
      totalChunksRead: interactions.length,
    };

    const result = await predictAttentionDrift(recentMetrics);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPacingSuggestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const metrics = await computeMetrics(sessionId);

    if (!metrics) {
      return res.json({ recommendedPace: "steady", chunkSizeAdjustment: 0, spacingAdjustment: 0, breakAfterChunks: null, motivationalNote: "Start reading to get personalized pacing." });
    }

    const profile = req.body?.profile ?? {};
    const result = await generatePacingSuggestion(metrics, profile);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};