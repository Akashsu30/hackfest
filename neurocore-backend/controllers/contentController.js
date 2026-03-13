import { transformContent } from "../services/contentTransformer.js";

export const transformText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    const transformed = transformContent(text);
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const simplifyChunk = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Rewrite the following text in much simpler language. Use short sentences. Avoid jargon. Aim for a reading level of a 12-year-old. Return only the simplified text, nothing else.\n\n${text}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const simplified =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Could not simplify.";

    res.json({ simplified });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
