import { createTool } from "@voltagent/core";
import { z } from "zod";

export const calculatorTool = createTool({
  name: "calculator",
  description: "基本的な数学計算を実行します",
  parameters: z.object({
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ operation, a, b }) => {
    console.log(`計算実行: ${a} ${operation} ${b}`);

    switch (operation) {
      case "add":
        return `計算結果: ${a} + ${b} = ${a + b}`;
      case "subtract":
        return `計算結果: ${a} - ${b} = ${a - b}`;
      case "multiply":
        return `計算結果: ${a} × ${b} = ${a * b}`;
      case "divide":
        if (b === 0) return "エラー: ゼロで割ることはできません";
        return `計算結果: ${a} ÷ ${b} = ${a / b}`;
      default:
        return "不明な演算です";
    }
  },
});
