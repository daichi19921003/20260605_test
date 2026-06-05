import type { Match, UserId } from "./types.ts";

export interface RankingEntry {
  userId: UserId;
  /** その試合で鬼だった累計秒数(少ないほど上位)。 */
  oniDurationSec: number;
  eliminated: boolean;
  /** 1 位から始まる順位。 */
  rank: number;
}

export interface MatchResult {
  matchId: string;
  rankings: RankingEntry[];
  /** 勝者(脱落していない中で鬼時間が最短)。該当なしは null。 */
  winnerId: UserId | null;
}

/**
 * 試合結果と順位を算出する。
 *
 * ルール: 脱落していないプレイヤーを「鬼だった累計秒数の昇順」で並べ、
 * 脱落者は最後尾に回す。最短の鬼時間のプレイヤーが勝者。
 */
export function computeMatchResult(match: Match): MatchResult {
  const sorted = [...match.players].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    return a.oniDurationSec - b.oniDurationSec;
  });

  const rankings: RankingEntry[] = sorted.map((p, i) => ({
    userId: p.userId,
    oniDurationSec: p.oniDurationSec,
    eliminated: p.eliminated,
    rank: i + 1,
  }));

  const winner = sorted.find((p) => !p.eliminated) ?? null;
  return { matchId: match.id, rankings, winnerId: winner ? winner.userId : null };
}
