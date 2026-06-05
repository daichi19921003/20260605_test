import { Router } from "express";
import { pool } from "../db.ts";

export const healthRouter = Router();

/** Liveness/readiness。DB 接続も確認する。 */
healthRouter.get("/", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "up" });
  } catch {
    res.status(503).json({ status: "degraded", db: "down" });
  }
});
