/** ドメインモデルの共有型定義。API と モバイルで共通利用する。 */

export type UserId = string;
export type AreaId = string;
export type MatchId = string;

/** 緯度経度。WGS84。 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** 位置情報サンプル(GPS取得結果)。 */
export interface LocationSample extends LatLng {
  /** 水平精度(メートル)。判定の信頼度フィルタに使う。 */
  accuracyM: number;
  /** 取得時刻(エポックミリ秒)。 */
  timestamp: number;
}

/** 試合中のプレイヤーの役割。 */
export type PlayerRole = "oni" | "runner";

/** 試合のライフサイクル状態。 */
export type MatchStatus = "recruiting" | "starting" | "in_progress" | "finished" | "cancelled";

/** プレイヤーの位置共有粒度の設定。 */
export interface PrivacySettings {
  /** 試合外でプロフィール上に位置を表示するか。false 推奨。 */
  shareLocationOutsideMatch: boolean;
  /** 試合後に移動軌跡を共有可能にするか。 */
  allowTrailSharing: boolean;
}

export interface User {
  id: UserId;
  displayName: string;
  /** 年齢確認済みフラグ(未成年保護のため必須)。 */
  ageVerified: boolean;
  privacy: PrivacySettings;
  createdAt: string;
}

/** ジオフェンス境界。MVP は円形、将来ポリゴン対応。 */
export type Geofence =
  | { kind: "circle"; center: LatLng; radiusM: number }
  | { kind: "polygon"; vertices: LatLng[] };

export interface Area {
  id: AreaId;
  name: string;
  fence: Geofence;
  hostId: UserId;
  minPlayers: number;
  maxPlayers: number;
  createdAt: string;
}

export interface MatchPlayer {
  userId: UserId;
  role: PlayerRole;
  /** その試合で鬼だった累計秒数(スコア算出に使用、少ないほど良い)。 */
  oniDurationSec: number;
  /** ジオフェンス外などで脱落したか。 */
  eliminated: boolean;
}

export interface Match {
  id: MatchId;
  areaId: AreaId;
  status: MatchStatus;
  /** 試合の制限時間(秒)。 */
  durationSec: number;
  /** タッチ判定距離(エリア/試合ごとに上書き可能)。 */
  tagDistanceM: number;
  players: MatchPlayer[];
  startedAt: string | null;
  finishedAt: string | null;
}
