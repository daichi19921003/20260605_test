import { randomUUID } from "node:crypto";
import {
  DEFAULT_TAG_DISTANCE_M,
  type Match,
  type MatchPlayer,
  type MatchResult,
  computeMatchResult,
} from "@oni/shared";
import type { MemoryStore } from "../store/memoryStore.ts";

export interface CreateMatchInput {
  areaId: string;
  durationSec?: number;
  tagDistanceM?: number;
}

/**
 * 試合のライフサイクル(募集→開始→鬼交代→終了)を管理する。
 *
 * 鬼だった累計秒数は「現在の鬼になった時刻(oniSince)」から差分で積算する。
 * リアルタイム判定(GameServer)は applyTagSwitch / eliminate を呼ぶだけでよい。
 */
export class MatchService {
  /** matchId -> 現在の鬼が鬼になった時刻(エポックミリ秒)。 */
  private readonly oniSince = new Map<string, number>();

  constructor(private readonly store: MemoryStore) {}

  create(input: CreateMatchInput): Match {
    const match: Match = {
      id: randomUUID(),
      areaId: input.areaId,
      status: "recruiting",
      durationSec: input.durationSec ?? 600,
      tagDistanceM: input.tagDistanceM ?? DEFAULT_TAG_DISTANCE_M,
      players: [],
      startedAt: null,
      finishedAt: null,
    };
    this.store.matches.set(match.id, match);
    return match;
  }

  get(id: string): Match | undefined {
    return this.store.matches.get(id);
  }

  /** 参加。最初の参加者が鬼、以降は逃走者。 */
  join(matchId: string, userId: string): Match {
    const match = this.require(matchId);
    if (match.status !== "recruiting") throw new Error("match_not_recruiting");
    if (match.players.some((p) => p.userId === userId)) return match;
    if (match.players.length >= 1_000) throw new Error("match_full");

    const player: MatchPlayer = {
      userId,
      role: match.players.length === 0 ? "oni" : "runner",
      oniDurationSec: 0,
      eliminated: false,
    };
    match.players.push(player);
    return match;
  }

  /** 試合開始。鬼の計時を開始する。 */
  start(matchId: string, now: number = Date.now()): Match {
    const match = this.require(matchId);
    if (match.status !== "recruiting") throw new Error("match_not_recruiting");
    if (match.players.length < 2) throw new Error("not_enough_players");
    match.status = "in_progress";
    match.startedAt = new Date(now).toISOString();
    this.oniSince.set(matchId, now);
    return match;
  }

  /**
   * 鬼交代を適用する。直前の鬼の累計時間を確定し、新しい鬼に切り替える。
   * @returns 交代前の鬼 userId
   */
  applyTagSwitch(matchId: string, newOni: string, now: number = Date.now()): string {
    const match = this.require(matchId);
    const current = match.players.find((p) => p.role === "oni");
    if (!current) throw new Error("no_current_oni");
    if (current.userId === newOni) return current.userId;

    this.accumulateOni(matchId, current, now);

    const next = match.players.find((p) => p.userId === newOni);
    if (!next || next.eliminated) throw new Error("invalid_new_oni");
    current.role = "runner";
    next.role = "oni";
    this.oniSince.set(matchId, now);
    return current.userId;
  }

  eliminate(matchId: string, userId: string): void {
    const match = this.require(matchId);
    const player = match.players.find((p) => p.userId === userId);
    if (player) player.eliminated = true;
  }

  /** 試合終了。現在の鬼の時間を確定し、結果を算出する。 */
  finish(matchId: string, now: number = Date.now()): MatchResult {
    const match = this.require(matchId);
    const current = match.players.find((p) => p.role === "oni");
    if (current) this.accumulateOni(matchId, current, now);
    match.status = "finished";
    match.finishedAt = new Date(now).toISOString();
    this.oniSince.delete(matchId);
    return computeMatchResult(match);
  }

  private accumulateOni(matchId: string, oni: MatchPlayer, now: number): void {
    const since = this.oniSince.get(matchId);
    if (since !== undefined) oni.oniDurationSec += Math.max(0, Math.round((now - since) / 1000));
  }

  private require(matchId: string): Match {
    const match = this.store.matches.get(matchId);
    if (!match) throw new Error("match_not_found");
    return match;
  }
}
