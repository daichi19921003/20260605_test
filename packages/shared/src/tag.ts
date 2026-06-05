import type { LatLng } from "./types.ts";
import { distanceM } from "./geo.ts";
import { TAG_HOLD_SECONDS } from "./constants.ts";

/**
 * 鬼交代判定の状態機械。
 *
 * 「鬼と特定の逃走者が tagDistanceM 以内に TAG_HOLD_SECONDS 継続して居る」と
 * タッチ成立とみなす。瞬間的なGPS誤差で誤交代しないよう継続時間を要求する。
 *
 * クライアント側で一次判定し、サーバーが権威判定として再検証する想定。
 */
export interface ProximityState {
  /** 閾値内に入り始めた時刻(エポックミリ秒)。閾値外なら null。 */
  withinSince: number | null;
}

export interface TagJudgment {
  state: ProximityState;
  /** この更新でタッチが成立したか。 */
  tagged: boolean;
}

export function initialProximityState(): ProximityState {
  return { withinSince: null };
}

/**
 * 鬼と1人の逃走者の距離を1サンプル分評価し、状態を更新する。
 *
 * @param oni      鬼の現在位置
 * @param runner   逃走者の現在位置
 * @param now      現在時刻(エポックミリ秒)
 * @param tagDistanceM タッチ判定距離
 * @param prev     直前の近接状態
 */
export function evaluateTag(
  oni: LatLng,
  runner: LatLng,
  now: number,
  tagDistanceM: number,
  prev: ProximityState,
): TagJudgment {
  const within = distanceM(oni, runner) <= tagDistanceM;

  if (!within) {
    return { state: { withinSince: null }, tagged: false };
  }

  const since = prev.withinSince ?? now;
  const heldSec = (now - since) / 1000;
  const tagged = heldSec >= TAG_HOLD_SECONDS;

  return {
    // タッチ成立後は状態をリセットして連続交代を防ぐ
    state: { withinSince: tagged ? null : since },
    tagged,
  };
}
