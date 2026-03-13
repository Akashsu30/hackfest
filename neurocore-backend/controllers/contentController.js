import { transformContent } from "../services/contentTransformer.js";
import { processContent, resolveDoubt } from "../services/contentProcessor.js";

export const transformText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Primary path: LangChain/Gemini pipeline.
    // Returns { chunks, sentences, simplified, bulletMode } on success.
    // Returns null if the LLM fails, times out, or returns malformed data.
    const llmResult = await processContent(text);
    if (llmResult) return res.json(llmResult);

    // Fallback path: original regex-based transformer.
    // Returns { sentences, simplified, bulletMode, chunkMode } — no `chunks` key.
    // Frontend detects the absence of `chunks` and uses sentence-grouping logic.
    console.warn("[contentController] LLM pipeline unavailable, using regex fallback.");
    return res.json(transformContent(text));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const simplifyChunk = async (_req, res) => {
  // Permanently retired — simplification is now pre-computed in /transform.
  res.status(410).json({
    error: "Gone",
    message: "Use content.chunks[i].simplified_text — no API call needed.",
  });
};

export const askDoubt = async (req, res) => {
  try {
    const { chunkText, question } = req.body;
    if (!chunkText || !question) {
      return res.status(400).json({ error: "chunkText and question are required" });
    }
    const answer = await resolveDoubt(chunkText.slice(0, 2000), question.slice(0, 500));
    if (!answer) {
      return res.status(503).json({ error: "AI is temporarily unavailable. Please try again." });
    }
    return res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
