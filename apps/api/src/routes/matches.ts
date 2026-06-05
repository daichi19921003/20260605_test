import { Router } from "express";

/**
 * 試合エンドポイント。
 * Phase 4 で募集→開始→終了のライフサイクルと WebSocket ルーム登録を実装する。
 */
export const matchesRouter = Router();

// TODO(Phase 4): POST /matches            - 試合作成(募集開始)
// TODO(Phase 4): POST /matches/:id/start  - 試合開始 + gameServer.registerRoom
// TODO(Phase 4): GET  /matches/:id        - 試合状態取得
matchesRouter.get("/", (_req, res) => {
  res.status(501).json({ message: "not_implemented", phase: 4 });
});
