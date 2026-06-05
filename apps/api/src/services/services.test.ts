import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryStore } from "../store/memoryStore.ts";
import { MatchService } from "./matchService.ts";
import { AreaService } from "./areaService.ts";
import { SafetyService } from "./safetyService.ts";
import { StatsService } from "./statsService.ts";

function setup() {
  const store = new MemoryStore();
  return {
    store,
    matches: new MatchService(store),
    areas: new AreaService(store),
    safety: new SafetyService(store),
    stats: new StatsService(store),
  };
}

test("試合ライフサイクル: 最初の参加者が鬼、開始→交代→終了で鬼時間が積算される", () => {
  const { matches, stats, store } = setup();
  const m = matches.create({ areaId: "a1" });
  matches.join(m.id, "alice"); // 鬼
  matches.join(m.id, "bob");
  matches.join(m.id, "carol");

  assert.equal(m.players.find((p) => p.role === "oni")!.userId, "alice");

  const t0 = 1_000_000;
  matches.start(m.id, t0);
  // 30秒後に bob が alice をタッチ → bob が鬼
  const prevOni = matches.applyTagSwitch(m.id, "bob", t0 + 30_000);
  assert.equal(prevOni, "alice");
  assert.equal(m.players.find((p) => p.role === "oni")!.userId, "bob");

  // さらに50秒後に終了 → bob が鬼だった50秒が確定
  const result = matches.finish(m.id, t0 + 80_000);
  const alice = m.players.find((p) => p.userId === "alice")!;
  const bob = m.players.find((p) => p.userId === "bob")!;
  assert.equal(alice.oniDurationSec, 30);
  assert.equal(bob.oniDurationSec, 50);
  // carol は一度も鬼でない → 最短 → 勝者
  assert.equal(result.winnerId, "carol");

  stats.recordMatchResult(m, result);
  assert.equal(stats.get("carol").wins, 1);
  assert.equal(stats.get("bob").totalOniSec, 50);
  assert.equal(store.stats.get("alice")!.matchesPlayed, 1);
});

test("試合開始: 2人未満は開始できない", () => {
  const { matches } = setup();
  const m = matches.create({ areaId: "a1" });
  matches.join(m.id, "solo");
  assert.throws(() => matches.start(m.id), /not_enough_players/);
});

test("エリア近傍検索: 半径内のエリアのみ近い順に返す", () => {
  const { areas } = setup();
  areas.create({ name: "近", hostId: "h", fence: { kind: "circle", center: { lat: 35.0, lng: 139.0 }, radiusM: 200 } });
  areas.create({ name: "遠", hostId: "h", fence: { kind: "circle", center: { lat: 36.0, lng: 139.0 }, radiusM: 200 } });
  const near = areas.listNearby({ lat: 35.0005, lng: 139.0 }, 1000);
  assert.equal(near.length, 1);
  assert.equal(near[0]!.name, "近");
});

test("安全: 自分への通報は不可、ブロックは相互に有効", () => {
  const { safety } = setup();
  assert.throws(() => safety.report({ reporterId: "a", targetId: "a", reason: "other" }), /cannot_report_self/);
  safety.block("a", "b");
  assert.equal(safety.isBlocked("b", "a"), true);
});
