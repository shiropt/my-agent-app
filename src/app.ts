import express, { Request, Response } from "express";
import { agent } from "./index.js";
// リクエストボディの型定義
type AgentRequestBody = {
  link: string;
  message: string;
};

// レスポンスボディの型定義
type AgentResponseBody = {
  summary: string;
};

type HealthCheckResponse = {
  message: string;
  timestamp: string;
};

type ErrorResponse = {
  error: string;
  code: string;
};

// Slack Webhook URL（環境変数から取得）
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || "";

// messageからURLを抽出する関数
function extractUrlFromMessage(message: string): string | null {
  // Slackのリンク形式 <URL|テキスト> からURLを抽出
  const slackLinkRegex = /<(https?:\/\/[^|>]+)(?:\|[^>]*)?>/;
  const match = message.match(slackLinkRegex);

  if (match && match[1]) {
    return match[1];
  }

  // 通常のURL形式も検索
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const urlMatch = message.match(urlRegex);

  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  return null;
}

// Slackにメッセージを送信する関数
async function sendToSlack(
  text: string,
  webhookUrl: string,
  threadId: string
): Promise<void> {
  try {
    // linkから抽出したthreadIdをthread_ts形式に変換
    // p1748738637043149 -> 1748738637.043149
    let thread_ts = threadId;
    if (threadId.startsWith("p") && threadId.length === 17) {
      // pを除去して、最初の10桁と残りの6桁の間にピリオドを挿入
      const timestamp = threadId.substring(1); // pを除去
      thread_ts = `${timestamp.substring(0, 10)}.${timestamp.substring(10)}`;
    }

    // まずthread_tsを含めて送信を試行
    const payloadWithThread = {
      text: `🤖 AI要約結果:\n${text}`,
      thread_ts,
      reply_broadcast: false,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadWithThread),
    });

    if (!response.ok) {
      const responseText = await response.text();

      // thread_tsが無効な場合は、thread_tsなしで再送信
      if (responseText.includes("invalid_thread_ts")) {
        const payloadWithoutThread = {
          text: `🤖 AI要約結果:\n${text}`,
        };

        const retryResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payloadWithoutThread),
        });

        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          throw new Error(
            `Slack webhook failed: ${retryResponse.status} ${retryResponse.statusText} - ${retryErrorText}`
          );
        }
      }

      throw new Error(
        `Slack webhook failed: ${response.status} ${response.statusText} - ${responseText}`
      );
    }
  } catch (error) {
    throw error;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// JSONボディパーサーのミドルウェア
app.use(express.json());

// ベースのヘルスチェックエンドポイント
app.get("/", async (req: Request, res: Response<HealthCheckResponse>) => {
  const response = await agent.generateText("横浜の天気は");
  res.json({
    message: response.text,
    timestamp: new Date().toISOString(),
  });
});

app.post(
  "/slack/events",
  async (
    req: Request<{}, AgentResponseBody, AgentRequestBody>,
    res: Response<AgentResponseBody | ErrorResponse>
  ): Promise<void> => {
    const { link, message } = req.body;

    console.log("リクエストを受け付けました:", { link, message });

    // リクエストボディの検証
    if (!link || !message) {
      res.status(400).json({
        error: "linkとmessageは必須です",
        code: "400",
      });
      return;
    }

    const threadId = link.split("/").pop() ?? "";
    // linkの最後の部分をそのままthread_tsとして使用
    console.log("threadId:", threadId);

    try {
      const url = extractUrlFromMessage(message);
      console.log("URL抽出結果:", url);

      if (!url) {
        console.log("URLが抽出できませんでした。メッセージ内容:", message);
        res.status(400).json({
          error: "メッセージからURLを抽出できませんでした",
          code: "400",
        });
        return;
      }

      console.log("抽出されたURL:", url);
      const response = await agent.generateText(url);
      console.log("response", response.text);

      // Slackにメッセージを送信（エラーが発生してもレスポンスは返す）
      try {
        // sendToSlack関数を使用
        await sendToSlack(response.text, slackWebhookUrl, threadId);
      } catch (slackError) {
        console.error(
          `❌ Slackへの送信でエラーが発生しましたが、処理を続行します: ${slackError}`
        );
      }

      res.status(200).json({
        summary: response.text,
      });
    } catch (error) {
      console.error("エラーが発生しました:", error);
      console.error("エラーの詳細:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        link,
        requestMessage: message,
        extractedUrl: extractUrlFromMessage(message),
      });
      res.status(500).json({
        error: "内部サーバーエラーが発生しました",
        code: "500",
      });
    }
  }
);

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
