import { randomUUID } from "node:crypto";
import { type Area, type Geofence, type LatLng, distanceM } from "@oni/shared";
import type { MemoryStore } from "../store/memoryStore.ts";

export interface CreateAreaInput {
  name: string;
  hostId: string;
  fence: Geofence;
  minPlayers?: number;
  maxPlayers?: number;
}

export class AreaService {
  constructor(private readonly store: MemoryStore) {}

  create(input: CreateAreaInput): Area {
    if (input.fence.kind === "circle" && input.fence.radiusM <= 0) {
      throw new Error("invalid_radius");
    }
    const minPlayers = input.minPlayers ?? 2;
    const maxPlayers = input.maxPlayers ?? 30;
    if (minPlayers < 2 || maxPlayers < minPlayers) throw new Error("invalid_player_bounds");

    const area: Area = {
      id: randomUUID(),
      name: input.name,
      hostId: input.hostId,
      fence: input.fence,
      minPlayers,
      maxPlayers,
      createdAt: new Date().toISOString(),
    };
    this.store.areas.set(area.id, area);
    return area;
  }

  get(id: string): Area | undefined {
    return this.store.areas.get(id);
  }

  /** 指定地点から withinM 以内に中心があるエリアを近い順に返す(円形対象)。 */
  listNearby(point: LatLng, withinM: number): Area[] {
    return [...this.store.areas.values()]
      .map((area) => ({ area, d: this.centerDistance(area, point) }))
      .filter((x) => x.d <= withinM)
      .sort((a, b) => a.d - b.d)
      .map((x) => x.area);
  }

  private centerDistance(area: Area, point: LatLng): number {
    if (area.fence.kind === "circle") return distanceM(area.fence.center, point);
    // ポリゴンは頂点平均を近似中心として扱う
    const v = area.fence.vertices;
    const c = v.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
    return distanceM({ lat: c.lat / v.length, lng: c.lng / v.length }, point);
  }
}
