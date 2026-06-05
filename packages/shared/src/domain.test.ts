import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMatchResult } from "./score.ts";
import { evaluateGeofence, initialGeofenceState } from "./safety.ts";
import type { Match } from "./types.ts";

function match(players: Array<[string, number, boolean]>): Match {
  return {
    id: "m1",
    areaId: "a1",
    status: "finished",
    durationSec: 600,
    tagDistanceM: 10,
    startedAt: null,
    finishedAt: null,
    players: players.map(([userId, oniDurationSec, eliminated]) => ({
      userId,
      role: "runner",
      oniDurationSec,
      eliminated,
    })),
  };
}

test("computeMatchResult: 鬼時間が最短の非脱落者が勝者", () => {
  const r = computeMatchResult(match([["a", 120, false], ["b", 30, false], ["c", 200, false]]));
  assert.equal(r.winnerId, "b");
  assert.equal(r.rankings[0]!.userId, "b");
  assert.equal(r.rankings[0]!.rank, 1);
});

test("computeMatchResult: 脱落者は最後尾", () => {
  const r = computeMatchResult(match([["a", 0, true], ["b", 100, false]]));
  assert.equal(r.winnerId, "b");
  assert.equal(r.rankings.at(-1)!.userId, "a");
});

test("evaluateGeofence: 境界内は inside", () => {
  const r = evaluateGeofence(true, 1000, initialGeofenceState());
  assert.equal(r.status, "inside");
});

test("evaluateGeofence: 境界外は猶予中 warning、猶予経過で eliminated", () => {
  const t0 = 1_000_000;
  const first = evaluateGeofence(false, t0, initialGeofenceState(), 15);
  assert.equal(first.status, "warning");
  assert.ok(first.graceSecLeft <= 15 && first.graceSecLeft > 0);

  const later = evaluateGeofence(false, t0 + 15_000, first.state, 15);
  assert.equal(later.status, "eliminated");
});

test("evaluateGeofence: 境界内に戻れば状態リセット", () => {
  const t0 = 1_000_000;
  const out = evaluateGeofence(false, t0, initialGeofenceState(), 15);
  const back = evaluateGeofence(true, t0 + 5000, out.state, 15);
  assert.equal(back.state.outsideSince, null);
});
