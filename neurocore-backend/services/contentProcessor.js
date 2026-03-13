// neurocore-backend/services/contentProcessor.js

import { cleanText } from "./contentTransformer.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";

// ---------------------------------------------------------------------------
// Lazy model init — MUST NOT be at module level.
// process.env.GEMINI_API_KEY is undefined at module load time because
// dotenv.config() in server.js runs AFTER all ESM imports are hoisted.
// ---------------------------------------------------------------------------
let _model = null;
const getModel = () => {
  if (!_model) {
    _model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.6, // Higher temp for more varied chunking and simplification
    });
  }
  return _model;
};

// ---------------------------------------------------------------------------
// Prompt template.
// ESCAPING RULES for PromptTemplate.fromTemplate():
//   {text}   → single braces = LangChain variable (replaced at runtime)
//   {{...}}  → double braces = literal { } sent to the model
// Every JSON brace in the schema example uses double braces.
// ---------------------------------------------------------------------------
const CHUNK_TEMPLATE = `You are an AI reading assistant designed to help students who struggle with reading, including students with dyslexia or ADHD.

Your job is to transform difficult text into a clean, readable learning format that an 8th-grade student can easily understand.

You must carefully analyse the text and decide:
• what parts are unnecessary formatting
• what needs cleaning
• how to split the text into readable chunks
• which words might be difficult for a student
• how to simplify the language while keeping the meaning

--------------------------------

STEP 1 — CLEAN THE TEXT

Carefully read the input text and remove elements that make the text harder to read but do NOT contribute to understanding.

Examples of things that should usually be removed:
• citation markers such as [1], [20], [a], [b]
• repeated reference numbers
• Wikipedia style editing markers
• stray numbers or formatting artifacts
• broken fragments that do not form natural sentences

Important rules:
• Keep all factual information
• Do NOT remove meaningful words or concepts
• The cleaned result should read like normal natural prose

--------------------------------

STEP 2 — CREATE READABLE CHUNKS

Split the cleaned text into small reading chunks.

Each chunk should:
• contain 1–3 related sentences
• represent one clear idea
• be short enough for a student to read comfortably
• remain faithful to the original meaning

Avoid:
• very long paragraphs
• mixing unrelated ideas in one chunk

--------------------------------

STEP 3 — CREATE A SIMPLIFIED VERSION

Rewrite the chunk so that an 8th-grade student who struggles with reading can understand it easily.

Guidelines:
• use shorter sentences
• use simple vocabulary
• explain difficult ideas clearly
• keep all important facts
• do not oversimplify or remove meaning

--------------------------------

STEP 4 — IDENTIFY DIFFICULT WORDS

Find words that may be difficult for a middle-school student.

For each word provide a short, clear meaning.

Example structure:
{{
"word": "democracy",
"meaning": "a system where people choose their leaders by voting"
}}

Do not include very common words.

--------------------------------

STEP 5 — COMPREHENSION CHECK

Write one simple question that checks whether the student understood the main idea of the chunk.

--------------------------------

OUTPUT FORMAT

Return ONLY valid JSON with the structure below.

{{
"chunks": [
{{
"chunk_id": 1,
"original_text": "cleaned readable text",
"simplified_text": "simplified version for easier reading",
"complex_words": [
{{
"word": "example",
"meaning": "short explanation"
}}
],
"comprehension_check": "question checking the main idea"
}}
]
}}

Do not include explanations or markdown.

--------------------------------

TEXT TO PROCESS:
{text}
`;

// ---------------------------------------------------------------------------
// extractJSON — fallback parser for when JsonOutputParser fails.
// Gemini sometimes wraps output in markdown code fences despite instructions.
// This function strips the fences and tries JSON.parse directly.
// ---------------------------------------------------------------------------
const extractJSON = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  // Strip ```json ... ``` or ``` ... ``` wrappers
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    // Try to find the outermost { ... } block
    const start = stripped.indexOf("{");
    const end   = stripped.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

// ---------------------------------------------------------------------------
// processContent — main export
//
// Returns { chunks, sentences, simplified, bulletMode } on success.
// Returns null on any failure so the controller can fall back to regex.
// ---------------------------------------------------------------------------
export const processContent = async (rawText) => {
  try {
    const cleaned = cleanText(rawText);

    // Limit input length to avoid hitting Gemini token limits on very long pastes
    const inputText = cleaned.length > 6000 ? cleaned.slice(0, 6000) + "…" : cleaned;

    // ── Attempt 1: use LangChain JsonOutputParser ───────────────────────────
    let result = null;
    try {
      const chain = RunnableSequence.from([
        PromptTemplate.fromTemplate(CHUNK_TEMPLATE),
        getModel(),
        new JsonOutputParser(),
      ]);
      result = await chain.invoke({ text: inputText });
      console.log("[contentProcessor] JsonOutputParser result:", JSON.stringify(result, null, 2));
    } catch (parseErr) {
      console.warn("[contentProcessor] JsonOutputParser failed:", parseErr.message);

      // ── Attempt 2: get raw string output and extract JSON manually ─────────
      try {
        const rawChain = RunnableSequence.from([
          PromptTemplate.fromTemplate(CHUNK_TEMPLATE),
          getModel(),
          new StringOutputParser(),
        ]);
        const rawText_ = await rawChain.invoke({ text: inputText });
        console.log("[contentProcessor] Raw LLM output (first 500 chars):", rawText_?.slice(0, 500));
        result = extractJSON(rawText_);
        if (result) {
          console.log("[contentProcessor] Extracted JSON via fallback parser.");
        }
      } catch (rawErr) {
        console.error("[contentProcessor] Raw chain also failed:", rawErr.message);
        return null;
      }
    }

    // Guard: response must be an object with a non-empty chunks array
    if (!result || !Array.isArray(result.chunks) || result.chunks.length === 0) {
      console.warn("[contentProcessor] Response has no valid chunks array — falling back to regex.");
      return null;
    }

    // Guard: every chunk must have a sequential chunk_id and non-empty original_text
    const valid = result.chunks.every(
      (c) =>
        (typeof c.chunk_id === "number" || typeof c.chunk_id === "string") &&
        typeof c.original_text === "string" &&
        c.original_text.trim().length > 0
    );

    if (!valid) {
      console.warn("[contentProcessor] Chunk validation failed — falling back to regex.");
      return null;
    }

    // Normalise chunk_id to number (model sometimes returns string)
    const chunks = result.chunks.map((c, i) => ({
      ...c,
      chunk_id: typeof c.chunk_id === "number" ? c.chunk_id : i + 1,
      complex_words: Array.isArray(c.complex_words) ? c.complex_words : [],
    }));

    // Derive backward-compatible fields so the rest of the app
    // (analyzeText, bullet mode, session metrics) keeps working unchanged.
    const sentences  = chunks.map((c) => c.original_text);
    const simplified = sentences.join(" ");
    const bulletMode = sentences.map((s) => `• ${s}`);

    console.log(`[contentProcessor] Success — ${chunks.length} chunks produced.`);
    return { chunks, sentences, simplified, bulletMode };

  } catch (err) {
    console.error("[contentProcessor] Unexpected error:", err.message);
    return null;
  }
};

// ---------------------------------------------------------------------------
// DOUBT TEMPLATE — for the Ask Doubt feature.
// Variables: {chunk} and {question}
// Both use single braces — both are LangChain variables, no literal braces needed.
// ---------------------------------------------------------------------------
const DOUBT_TEMPLATE = `You are a friendly reading tutor helping a student understand a passage.

The student is reading this passage:
"{chunk}"

The student asks:
"{question}"

Answer the question clearly and simply. Write 2 to 3 sentences. Use language a middle-school student can understand. Do not repeat the question. Do not add "As a tutor" or similar phrases. Just answer directly.`;

// ---------------------------------------------------------------------------
// resolveDoubt — called by the /api/content/doubt endpoint.
// Returns a plain-text answer string, or null on failure.
// ---------------------------------------------------------------------------
export const resolveDoubt = async (chunkText, question) => {
  try {
    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(DOUBT_TEMPLATE),
      getModel(),
      new StringOutputParser(),
    ]);
    const answer = await chain.invoke({ chunk: chunkText, question });
    return answer?.trim() || null;
  } catch (err) {
    console.error("[contentProcessor] Doubt resolution error:", err.message);
    return null;
  }
};
