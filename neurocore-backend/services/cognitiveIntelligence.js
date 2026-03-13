import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";

let _model = null;
const getModel = () => {
  if (!_model) {
    _model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.2,
    });
  }
  return _model;
};

const runChain = async (template, input) => {
  const parser = new JsonOutputParser();

  const prompt = PromptTemplate.fromTemplate(template);

  const chain = RunnableSequence.from([
    prompt,
    getModel(),
    parser
  ]);

  try {
    return await chain.invoke(input);
  } catch {
    return null;
  }
};

const runTextChain = async (template, input) => {
  const parser = new StringOutputParser();

  const prompt = PromptTemplate.fromTemplate(template);

  const chain = RunnableSequence.from([
    prompt,
    getModel(),
    parser,
  ]);

  try {
    return await chain.invoke(input);
  } catch {
    return null;
  }
};

/**
 * Predict reading difficulty
 */
export const predictReadingDifficulty = async (text) => {
  const template = `
Analyze the reading difficulty of the text.

Return JSON:
{
  "gradeLevel": number,
  "complexityScore": number,
  "hardWords": string[],
  "estimatedReadMinutes": number,
  "difficultyLabel": "easy | moderate | hard | very hard",
  "suggestion": string
}

Text:
{text}
`;

  const result = await runChain(template, {
    text: text.slice(0, 1500),
  });

  return (
    result ?? {
      complexityScore: 50,
      difficultyLabel: "moderate",
      gradeLevel: 8,
      hardWords: [],
      estimatedReadMinutes: 5,
      suggestion: "Read at your own pace.",
    }
  );
};

/**
 * Estimate chunk cognitive load
 */
export const estimateCognitiveLoad = async (chunks) => {
  const numbered = chunks
    .slice(0, 20)
    .map((c, i) => `[${i}] ${c}`)
    .join("\n");

  const template = `
For each numbered text chunk estimate cognitive load.

Return JSON array:
[
 { "chunkIndex": number, "loadScore": number, "reason": string }
]

Chunks:
{chunks}
`;

  const result = await runChain(template, { chunks: numbered });

  return result ?? [];
};

/**
 * Predict attention drift
 */
export const predictAttentionDrift = async (recentMetrics) => {
  const template = `
Predict attention drift risk based on these metrics.

Return JSON:
{
  "driftRisk": number,
  "predictedDriftIn": number | null,
  "reason": string,
  "recommendation": string
}

Metrics:
{metrics}
`;

  const result = await runChain(template, {
    metrics: JSON.stringify(recentMetrics),
  });

  return (
    result ?? {
      driftRisk: 30,
      predictedDriftIn: null,
      reason: "Stable pattern.",
      recommendation: "Continue reading.",
    }
  );
};

/**
 * Generate pacing suggestion
 */
export const generatePacingSuggestion = async (metrics, profile) => {
  const template = `
Based on session metrics and user profile generate adaptive pacing.

Return JSON:
{
 "recommendedPace": "slow | steady | fast",
 "chunkSizeAdjustment": -1 | 0 | 1,
 "spacingAdjustment": -0.2 | 0 | 0.2,
 "breakAfterChunks": number | null,
 "motivationalNote": string
}

Session metrics:
{metrics}

User profile:
{profile}
`;

  const result = await runChain(template, {
    metrics: JSON.stringify(metrics),
    profile: JSON.stringify(profile),
  });

  return (
    result ?? {
      recommendedPace: "steady",
      chunkSizeAdjustment: 0,
      spacingAdjustment: 0,
      breakAfterChunks: null,
      motivationalNote: "You're doing great, keep going.",
    }
  );
};

/**
 * Simplify a text chunk to a lower reading level
 */
export const simplifyText = async (text) => {
  const template = `Rewrite the following text in much simpler language. Use short sentences. Avoid jargon. Aim for a reading level of a 12-year-old. Return only the simplified text, nothing else.

{text}`;

  const result = await runTextChain(template, { text });

  return result ?? null;
};