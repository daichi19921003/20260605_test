/**
 * ゲーム全体で共有する調整パラメータ。
 * クライアント(モバイル)とサーバー(API)の両方が同じ値を参照することで、
 * 鬼交代判定やジオフェンス判定の挙動を一致させる。
 */

/** 鬼が逃走者をタッチしたとみなす距離(メートル)。 */
export const DEFAULT_TAG_DISTANCE_M = 10;

/** タッチ成立に必要な「閾値内に居続ける」継続秒数。GPS誤差による誤判定を防ぐ。 */
export const TAG_HOLD_SECONDS = 2;

/** 位置情報をブロードキャストする間隔(ミリ秒)。短いほど精度↑・電池/通信消費↑。 */
export const LOCATION_BROADCAST_INTERVAL_MS = 1500;

/** ジオフェンス外に出てから自動脱落までの猶予秒数。 */
export const GEOFENCE_WARNING_GRACE_SECONDS = 15;

/** チート検知: これを超える移動速度(m/s)はGPS偽装/異常として扱う。約43km/h。 */
export const MAX_REASONABLE_SPEED_MPS = 12;

/** プロフィール等、試合外で他人に位置を見せる際に丸める粒度(メートル)。 */
export const PRIVACY_LOCATION_ROUNDING_M = 500;
