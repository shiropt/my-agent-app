import { createTool } from "@voltagent/core";
import { z } from "zod";

export const urlSummarizerTool = createTool({
  name: "url_summarizer",
  description: "指定されたURLの内容を日本語で要約します",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async ({ url }) => {
    console.log(`URLを取得中: ${url}`);
    const response = await fetch(url);
    const text = await response.text();

    return `以下のURLの内容を必ず日本語で要約してください。英語ではなく日本語で回答してください：

URL: ${url}

内容:
${text}

【重要】上記の内容を日本語で分かりやすく要約してください。回答は必ず日本語でお願いします。`;
  },
});
