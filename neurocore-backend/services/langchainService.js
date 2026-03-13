import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY
});

export async function analyzeDifficulty(text) {

  const prompt = PromptTemplate.fromTemplate(`
Analyze this text and return JSON:

Text:
{text}

Return:
{
  "gradeLevel": "",
  "difficulty": "",
  "hardWords": [],
  "suggestion": ""
}
`);

  const chain = RunnableSequence.from([
    prompt,
    model
  ]);

  const result = await chain.invoke({ text });

  return result.content;
}