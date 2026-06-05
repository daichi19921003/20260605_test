import { Router } from "express";
import { services } from "../context.ts";

export const usersRouter = Router();

/** ユーザー作成(年齢確認フラグ必須)。 */
usersRouter.post("/", (req, res) => {
  const { displayName, ageVerified } = req.body ?? {};
  if (typeof displayName !== "string" || !displayName.trim()) {
    return res.status(400).json({ error: "displayName_required" });
  }
  const user = services.users.create(displayName.trim(), ageVerified === true);
  res.status(201).json(user);
});

usersRouter.get("/:id", (req, res) => {
  const user = services.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  res.json(user);
});

/** プライバシー設定の更新。 */
usersRouter.patch("/:id/privacy", (req, res) => {
  try {
    res.json(services.users.updatePrivacy(req.params.id, req.body ?? {}));
  } catch {
    res.status(404).json({ error: "user_not_found" });
  }
});

/** 通算戦績。 */
usersRouter.get("/:id/stats", (req, res) => {
  res.json(services.stats.get(req.params.id));
});
