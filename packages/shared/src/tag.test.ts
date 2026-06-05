import { test } from "node:test";
import assert from "node:assert/strict";
import { distanceM, roundForPrivacy } from "./geo.ts";
import { evaluateTag, initialProximityState } from "./tag.ts";
import { TAG_HOLD_SECONDS } from "./constants.ts";

test("distanceM: 同一点は 0m", () => {
  assert.equal(distanceM({ lat: 35.0, lng: 139.0 }, { lat: 35.0, lng: 139.0 }), 0);
});

test("distanceM: 緯度0.001度差は約111m", () => {
  const d = distanceM({ lat: 35.0, lng: 139.0 }, { lat: 35.001, lng: 139.0 });
  assert.ok(Math.abs(d - 111) < 2, `expected ~111m, got ${d}`);
});

test("evaluateTag: 閾値外ではタッチしない", () => {
  const oni = { lat: 35.0, lng: 139.0 };
  const runner = { lat: 35.01, lng: 139.0 }; // ~1.1km
  const r = evaluateTag(oni, runner, Date.now(), 10, initialProximityState());
  assert.equal(r.tagged, false);
  assert.equal(r.state.withinSince, null);
});

test("evaluateTag: 閾値内でも継続時間が足りなければタッチしない", () => {
  const oni = { lat: 35.0, lng: 139.0 };
  const runner = { lat: 35.0, lng: 139.0 };
  const t0 = 1_000_000;
  const r = evaluateTag(oni, runner, t0, 10, initialProximityState());
  assert.equal(r.tagged, false);
  assert.equal(r.state.withinSince, t0);
});

test("evaluateTag: 閾値内に必要秒数留まるとタッチ成立しリセット", () => {
  const oni = { lat: 35.0, lng: 139.0 };
  const runner = { lat: 35.0, lng: 139.0 };
  const t0 = 1_000_000;
  const first = evaluateTag(oni, runner, t0, 10, initialProximityState());
  const later = evaluateTag(oni, runner, t0 + TAG_HOLD_SECONDS * 1000, 10, first.state);
  assert.equal(later.tagged, true);
  assert.equal(later.state.withinSince, null);
});

test("roundForPrivacy: 冪等で、元座標から粒度未満しかずれない", () => {
  const raw = { lat: 35.123456, lng: 139.123456 };
  const rounded = roundForPrivacy(raw);
  // 冪等: 丸めた点を再度丸めても変わらない
  assert.deepEqual(roundForPrivacy(rounded), rounded);
  // 丸めによる移動量は粒度(約500m)未満に収まる
  assert.ok(distanceM(raw, rounded) < 500, `moved ${distanceM(raw, rounded)}m`);
});
