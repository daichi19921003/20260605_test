import { Router } from "express";
import { services } from "../context.ts";
import { getGameServer } from "../realtime/instance.ts";

export const matchesRouter = Router();

/** 試合作成(募集開始)。 */
matchesRouter.post("/", (req, res) => {
  const { areaId, durationSec, tagDistanceM } = req.body ?? {};
  if (!areaId || !services.areas.get(areaId)) {
    return res.status(400).json({ error: "valid_areaId_required" });
  }
  res.status(201).json(services.matches.create({ areaId, durationSec, tagDistanceM }));
});

matchesRouter.get("/:id", (req, res) => {
  const match = services.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: "match_not_found" });
  res.json(match);
});

/** 参加。ブロック関係にある参加者がいる場合は拒否(対人安全)。 */
matchesRouter.post("/:id/join", (req, res) => {
  const { userId } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: "userId_required" });
  const match = services.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: "match_not_found" });

  const blocked = match.players.some((p) => services.safety.isBlocked(p.userId, userId));
  if (blocked) return res.status(403).json({ error: "blocked_participant" });

  try {
    res.json(services.matches.join(req.params.id, userId));
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

/** 試合開始。WebSocket ルームを登録してリアルタイム判定を有効化する。 */
matchesRouter.post("/:id/start", (req, res) => {
  const match = services.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: "match_not_found" });
  const area = services.areas.get(match.areaId);
  if (!area) return res.status(400).json({ error: "area_not_found" });

  try {
    const started = services.matches.start(req.params.id);
    getGameServer()?.registerRoom(started.id, area.fence, started.tagDistanceM);
    res.json(started);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

/** 試合終了。結果を算出し通算戦績へ反映する。 */
matchesRouter.post("/:id/finish", (req, res) => {
  const match = services.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: "match_not_found" });
  try {
    const result = services.matches.finish(req.params.id);
    services.stats.recordMatchResult(match, result);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});
