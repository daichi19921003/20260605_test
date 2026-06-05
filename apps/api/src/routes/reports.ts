import { Router } from "express";
import { services } from "../context.ts";

export const reportsRouter = Router();

/** 通報。 */
reportsRouter.post("/", (req, res) => {
  try {
    res.status(201).json(services.safety.report(req.body));
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

/** ブロック。 */
reportsRouter.post("/block", (req, res) => {
  const { userId, blockedUserId } = req.body ?? {};
  if (!userId || !blockedUserId) return res.status(400).json({ error: "ids_required" });
  try {
    services.safety.block(userId, blockedUserId);
    res.status(204).end();
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});
