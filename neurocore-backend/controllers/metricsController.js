import { computeMetrics } from "../services/cognitiveEngine.js";

export const analyzeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const metrics = await computeMetrics(sessionId);

    if (!metrics) {
      return res.status(404).json({ error: "No interactions found for this session" });
    }

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};