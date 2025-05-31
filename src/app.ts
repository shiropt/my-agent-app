import express, { Request, Response, NextFunction } from "express";
import { agent } from "./index.js";

// リクエストボディの型定義
interface AgentRequestBody {
  url: string;
  token?: string;
  challenge?: string;
  type?: string;
}

// レスポンスボディの型定義
interface AgentResponseBody {
  summary?: string;
  token?: string;
  challenge?: string;
  type?: string;
}

interface HealthCheckResponse {
  message: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  code: string;
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
    const { url, token, challenge, type } = req.body;
    // URL Verification か通常イベントかを判定
    if (req.body.type === "url_verification") {
      console.log("url_verification", challenge);
      res.status(200).json({
        challenge,
      });
      return;
    }

    if (!url) {
      res.status(400).json({
        error: "url は必須です",
        code: "400",
      });
      return;
    }
    // console.log("challenge", challenge);

    const response = await agent.generateText(url);
    console.log("response", response.text);
    res.status(200).json({
      summary: response.text,
      challenge,
    });
  }
);

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
