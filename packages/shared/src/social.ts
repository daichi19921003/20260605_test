import type { MatchId, UserId } from "./types.ts";

/** 通報理由。 */
export type ReportReason = "harassment" | "stalking" | "cheating" | "unsafe_behavior" | "other";

export interface Report {
  id: string;
  reporterId: UserId;
  targetId: UserId;
  matchId: MatchId | null;
  reason: ReportReason;
  detail: string;
  createdAt: string;
}

/** ブロック関係(reporter が target を試合マッチングから除外)。 */
export interface Block {
  userId: UserId;
  blockedUserId: UserId;
  createdAt: string;
}

/** ユーザーの通算戦績(SNS プロフィール用)。 */
export interface UserStats {
  userId: UserId;
  matchesPlayed: number;
  wins: number;
  /** 鬼だった累計秒数(全試合)。 */
  totalOniSec: number;
  /** 脱落回数。 */
  eliminations: number;
}
