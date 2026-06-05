import { Router } from "express";
import { services } from "../context.ts";

export const areasRouter = Router();

/** 円形ジオフェンスのエリアを作成。 */
areasRouter.post("/", (req, res) => {
  try {
    const area = services.areas.create(req.body);
    res.status(201).json(area);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

/** 近傍エリア一覧。?lat=&lng=&within=(m) */
areasRouter.get("/", (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const within = Number(req.query.within ?? 5000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat_lng_required" });
  }
  res.json(services.areas.listNearby({ lat, lng }, within));
});

areasRouter.get("/:id", (req, res) => {
  const area = services.areas.get(req.params.id);
  if (!area) return res.status(404).json({ error: "area_not_found" });
  res.json(area);
});
