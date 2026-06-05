import type { Geofence, LatLng, LocationSample } from "./types.ts";
import { MAX_REASONABLE_SPEED_MPS, PRIVACY_LOCATION_ROUNDING_M } from "./constants.ts";

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** 2点間の大圏距離(メートル)を Haversine で計算する。 */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 点がジオフェンス内にあるか。円形のみ厳密、ポリゴンは ray-casting。 */
export function isInsideFence(point: LatLng, fence: Geofence): boolean {
  if (fence.kind === "circle") {
    return distanceM(point, fence.center) <= fence.radiusM;
  }
  return isInsidePolygon(point, fence.vertices);
}

/** ray-casting によるポリゴン内外判定(小エリア前提で平面近似)。 */
function isInsidePolygon(point: LatLng, vertices: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const vi = vertices[i]!;
    const vj = vertices[j]!;
    const intersects =
      vi.lng > point.lng !== vj.lng > point.lng &&
      point.lat <
        ((vj.lat - vi.lat) * (point.lng - vi.lng)) / (vj.lng - vi.lng) + vi.lat;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * 2つの位置サンプルから移動速度(m/s)を算出する。
 * チート検知(テレポート/位置偽装)に使用。
 */
export function speedMps(prev: LocationSample, next: LocationSample): number {
  const dtSec = (next.timestamp - prev.timestamp) / 1000;
  if (dtSec <= 0) return Infinity;
  return distanceM(prev, next) / dtSec;
}

/** 速度が現実的な上限を超えていれば位置偽装の疑いとみなす。 */
export function isImplausibleMove(prev: LocationSample, next: LocationSample): boolean {
  return speedMps(prev, next) > MAX_REASONABLE_SPEED_MPS;
}

/**
 * プライバシー保護のため座標を粗い格子に丸める。
 * 試合外でのプロフィール表示などに使用。
 */
export function roundForPrivacy(point: LatLng): LatLng {
  // 緯度1度 ≈ 111km。丸め粒度を度に換算してスナップする。
  const stepDeg = PRIVACY_LOCATION_ROUNDING_M / 111_000;
  const snap = (v: number) => Math.round(v / stepDeg) * stepDeg;
  return { lat: snap(point.lat), lng: snap(point.lng) };
}
