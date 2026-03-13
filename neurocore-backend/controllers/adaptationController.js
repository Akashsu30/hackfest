import { computeMetrics } from "../services/cognitiveEngine.js";
import { generateAdaptation } from "../services/adaptationEngine.js";

export const getAdaptation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const metrics = await computeMetrics(sessionId);

    if (!metrics) {
      return res.status(404).json({ error: "No interactions found for this session" });
    }

    const adaptation = generateAdaptation(metrics);
    adaptation._metrics = metrics;

    res.json({ metrics, adaptation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};