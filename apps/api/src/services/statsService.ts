import type { Match, MatchResult, UserStats } from "@oni/shared";
import type { MemoryStore } from "../store/memoryStore.ts";

/** 通算戦績の集計(SNS プロフィール用)。 */
export class StatsService {
  constructor(private readonly store: MemoryStore) {}

  get(userId: string): UserStats {
    return this.store.stats.get(userId) ?? this.empty(userId);
  }

  /** 試合終了時に全参加者の通算戦績へ反映する。 */
  recordMatchResult(match: Match, result: MatchResult): void {
    for (const player of match.players) {
      const stats = this.store.stats.get(player.userId) ?? this.empty(player.userId);
      stats.matchesPlayed += 1;
      stats.totalOniSec += player.oniDurationSec;
      if (player.eliminated) stats.eliminations += 1;
      if (result.winnerId === player.userId) stats.wins += 1;
      this.store.stats.set(player.userId, stats);
    }
  }

  private empty(userId: string): UserStats {
    return { userId, matchesPlayed: 0, wins: 0, totalOniSec: 0, eliminations: 0 };
  }
}
