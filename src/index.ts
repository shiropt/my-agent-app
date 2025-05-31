import { VoltAgent, Agent } from "@voltagent/core";
import { GoogleGenAIProvider } from "@voltagent/google-ai";
import { weatherTool, urlSummarizerTool } from "./tools/index.js";
const apiKey = process.env.GEMINI_API_KEY || "";
// Using API Key configuration from above
const googleProvider = new GoogleGenAIProvider({
  apiKey,
});
// Or using Vertex AI configuration
// const googleProvider = new GoogleGenAIProvider({ project: '...', location: '...' });

export const agent = new Agent({
  name: "Google Gemini Agent",
  instructions: "An agent powered by Google Gemini with useful tools",
  llm: googleProvider,
  model: "gemini-1.5-flash", // Specify the desired Google model ID
  markdown: true,
  tools: [weatherTool, urlSummarizerTool], // ツールを追加
});

const response = await agent.generateText("横浜の天気は");
console.log("こんにちは", response.text);

new VoltAgent({
  agents: {
    agent,
  },
});
