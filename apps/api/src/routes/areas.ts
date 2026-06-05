import { Router } from "express";

/**
 * エリア(ジオフェンス)エンドポイント。
 * Phase 2 で PostGIS による作成・一覧・近傍検索を実装する。
 */
export const areasRouter = Router();

// TODO(Phase 2): POST /areas  - 円形ジオフェンスの作成
// TODO(Phase 2): GET  /areas  - 近傍エリアの一覧 (ST_DWithin)
areasRouter.get("/", (_req, res) => {
  res.status(501).json({ message: "not_implemented", phase: 2 });
});
