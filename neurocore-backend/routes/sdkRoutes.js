import express from "express";
import { transformContent } from "../services/contentTransformer.js";
import { predictReadingDifficulty } from "../services/cognitiveIntelligence.js";

const router = express.Router();

/**
 * Public SDK endpoint — embeddable reader config.
 * Any third-party platform can POST text and get back
 * transformed chunks + difficulty analysis.
 */
router.post("/transform", async (req, res) => {
  try {
    const { text, apiKey } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });

    // Simple API key check — in production use a proper key system
    if (apiKey !== process.env.SDK_API_KEY && process.env.SDK_API_KEY !== "open") {
      return res.status(401).json({ error: "Invalid SDK API key" });
    }

    const [transformed, difficulty] = await Promise.all([
      transformContent(text),
      predictReadingDifficulty(text),
    ]);

    res.json({
      ...transformed,
      difficulty,
      embedConfig: {
        defaultChunkSize: 2,
        defaultFontSize: 18,
        defaultLineSpacing: 1.7,
        availableModes: ["focus", "ruler", "dyslexia", "tts"],
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;