import { GEOFENCE_WARNING_GRACE_SECONDS } from "./constants.ts";

/** ジオフェンス境界監視の状態。 */
export interface GeofenceState {
  /** 境界外に出た時刻(エポックミリ秒)。境界内なら null。 */
  outsideSince: number | null;
}

export type GeofenceStatus = "inside" | "warning" | "eliminated";

export interface GeofenceJudgment {
  state: GeofenceState;
  status: GeofenceStatus;
  /** warning 時の残り猶予秒数(切り上げ)。それ以外は 0。 */
  graceSecLeft: number;
}

export function initialGeofenceState(): GeofenceState {
  return { outsideSince: null };
}

/**
 * ジオフェンス境界の猶予つき判定。
 *
 * 境界外に出ても即脱落させず、`graceSec` 秒の猶予を与えて警告する。
 * 猶予を過ぎると eliminated。境界内に戻れば状態はリセットされる。
 */
export function evaluateGeofence(
  inside: boolean,
  now: number,
  prev: GeofenceState,
  graceSec: number = GEOFENCE_WARNING_GRACE_SECONDS,
): GeofenceJudgment {
  if (inside) {
    return { state: { outsideSince: null }, status: "inside", graceSecLeft: 0 };
  }

  const since = prev.outsideSince ?? now;
  const elapsedSec = (now - since) / 1000;

  if (elapsedSec >= graceSec) {
    return { state: { outsideSince: since }, status: "eliminated", graceSecLeft: 0 };
  }
  return {
    state: { outsideSince: since },
    status: "warning",
    graceSecLeft: Math.ceil(graceSec - elapsedSec),
  };
}
