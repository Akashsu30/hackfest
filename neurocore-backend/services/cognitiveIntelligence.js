const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

const gemini = async (prompt) => {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
};

const safeJSON = (text) => {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
};

/**
 * Predicts reading difficulty of the full text before the session starts.
 * Returns: grade level, complexity score, hard words, estimated read time.
 */
export const predictReadingDifficulty = async (text) => {
  const prompt = `Analyze the reading difficulty of this text. Return ONLY a JSON object with no markdown:
{
  "gradeLevel": <number 1-16>,
  "complexityScore": <number 0-100>,
  "hardWords": [<up to 5 difficult words>],
  "estimatedReadMinutes": <number>,
  "difficultyLabel": "easy" | "moderate" | "hard" | "very hard",
  "suggestion": "<one sentence suggestion for the reader>"
}

Text: """${text.slice(0, 1500)}"""`;

  const raw = await gemini(prompt);
  return safeJSON(raw) ?? { complexityScore: 50, difficultyLabel: "moderate", gradeLevel: 8, hardWords: [], estimatedReadMinutes: 5, suggestion: "Read at your own pace." };
};

/**
 * Estimates cognitive load for each chunk.
 * Returns array of { chunkIndex, loadScore, reason }
 */
export const estimateCognitiveLoad = async (chunks) => {
  const numbered = chunks.slice(0, 20).map((c, i) => `[${i}] ${c}`).join("\n");

  const prompt = `For each numbered text chunk below, estimate cognitive load (0-100).
Higher = harder to process. Return ONLY a JSON array, no markdown:
[
  { "chunkIndex": 0, "loadScore": <0-100>, "reason": "<5 words max>" },
  ...
]

Chunks:
${numbered}`;

  const raw = await gemini(prompt);
  return safeJSON(raw) ?? [];
};

/**
 * Predicts attention drift risk based on recent interaction pattern.
 * Returns: driftRisk (0-100), predictedDriftIn (chunks), recommendation.
 */
export const predictAttentionDrift = async (recentMetrics) => {
  const prompt = `Based on these recent reading metrics, predict attention drift risk.
Return ONLY a JSON object, no markdown:
{
  "driftRisk": <0-100>,
  "predictedDriftIn": <number of chunks until likely drift, or null>,
  "reason": "<one sentence>",
  "recommendation": "<one actionable suggestion>"
}

Recent metrics: ${JSON.stringify(recentMetrics)}`;

  const raw = await gemini(prompt);
  return safeJSON(raw) ?? { driftRisk: 30, predictedDriftIn: null, reason: "Stable pattern.", recommendation: "Continue reading." };
};

/**
 * Generates adaptive pacing suggestion based on full session metrics.
 * Returns: pace, adjustments, motivationalNote.
 */
export const generatePacingSuggestion = async (metrics, profile) => {
  const prompt = `Based on these reading session metrics and user profile, suggest adaptive pacing.
Return ONLY a JSON object, no markdown:
{
  "recommendedPace": "slow" | "steady" | "fast",
  "chunkSizeAdjustment": -1 | 0 | 1,
  "spacingAdjustment": -0.2 | 0 | 0.2,
  "breakAfterChunks": <number or null>,
  "motivationalNote": "<one encouraging sentence under 15 words>"
}

Session metrics: ${JSON.stringify(metrics)}
User profile: ${JSON.stringify(profile)}`;

  const raw = await gemini(prompt);
  return safeJSON(raw) ?? { recommendedPace: "steady", chunkSizeAdjustment: 0, spacingAdjustment: 0, breakAfterChunks: null, motivationalNote: "You're doing great, keep going." };
};