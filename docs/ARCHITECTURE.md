# Oni アーキテクチャ

リアル空間の鬼ごっこ SNS アプリ。GPS + ジオフェンスで鬼が自動交代する。

## モノレポ構成

```
oni/
├── packages/
│   └── shared/        # 共通の型・定数・地理計算・鬼交代判定・WSイベント契約
├── apps/
│   ├── api/           # Node + Express + WebSocket + PostgreSQL/PostGIS
│   └── mobile/        # React Native (Expo)
└── docs/
```

`@oni/shared` をクライアントとサーバーの両方が参照することで、
鬼交代やジオフェンスの判定ロジックを一致させる(`tag.ts` / `geo.ts`)。

## コアフロー(鬼交代)

1. モバイルが GPS 位置を `LOCATION_BROADCAST_INTERVAL_MS` 間隔で WebSocket 送信
2. API (`GameServer`) が受信し、
   - チート検知(`isImplausibleMove`: 非現実的な移動速度)
   - ジオフェンス境界(`isInsideFence`)
   - 鬼⇔逃走者の距離判定(`evaluateTag`: 閾値内に `TAG_HOLD_SECONDS` 継続でタッチ成立)
3. タッチ成立で役割交代し、全プレイヤーへ `role_changed` をブロードキャスト

クライアントで一次判定し、サーバーが権威判定として再検証する。

## 安全・プライバシー(設計原則)

- 試合外は正確な座標を他人に出さない(`roundForPrivacy` で粗く丸める)
- 位置生ログ(`location_samples`)は短期保持で定期削除
- 通報・ブロック・年齢確認・夜間制限(Phase 5)

## 実装フェーズ

| Phase | 内容 | 状態 |
|---|---|---|
| 0 | モノレポ基盤・共有型・API/モバイル雛形・CI | ✅ 完了 |
| 1 | ユーザー・プロフィール・プライバシー設定 (`UserService`, `/users`) | ✅ ロジック実装 |
| 2 | エリア(ジオフェンス)作成・近傍検索 (`AreaService`, `/areas`) | ✅ ロジック実装 |
| 3 | リアルタイム位置同期(`useLocationTracking`, `RealtimeClient`) | ✅ クライアント実装 |
| 4 | 試合ライフサイクル・鬼交代・鬼時間積算 (`MatchService`, `GameServer`) | ✅ ロジック実装 |
| 5 | 安全機能(通報/ブロック・ジオフェンス猶予・位置丸め) | ✅ ロジック実装 |
| 6 | SNS(募集/参加/戦績) (`StatsService`, `computeMatchResult`) | ✅ 基本実装 / 軌跡・リプレイは将来 |
| 7 | ベータ・負荷/電池検証 | ⏳ 単体テスト15件。負荷/実機検証は今後 |

> 現状のデータ層はインメモリ実装(`MemoryStore`)で全機能が動作・テスト可能。
> 本番は同インターフェイスを PostgreSQL/PostGIS(`db/schema.sql`)へ差し替える。
> 認証本体(トークン発行)・地図描画・軌跡リプレイ・背景位置の常時稼働は次イテレーション。

## ローカル開発

```bash
npm install
# DB(PostGIS)を用意し schema を適用
psql "$DATABASE_URL" -f apps/api/db/schema.sql
# API
npm run dev -w @oni/api
# モバイル
npm run start -w @oni/mobile
# テスト/型チェック
npm test && npm run typecheck
```
