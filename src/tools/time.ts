import { createTool } from "@voltagent/core";
import { z } from "zod";

export const timeTool = createTool({
  name: "get_current_time",
  description: "現在の日時を取得します",
  parameters: z.object({}),
  execute: async () => {
    console.log("現在時刻を取得中");
    const now = new Date();
    const formattedTime = now.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "long",
    });
    return `現在の時刻: ${formattedTime}`;
  },
});
