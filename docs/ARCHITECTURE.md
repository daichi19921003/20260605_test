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
| 0 | モノレポ基盤・共有型・API/モバイル雛形・CI | ✅ 本コミット |
| 1 | 認証・プロフィール・プライバシー設定 | 未着手 |
| 2 | エリア(ジオフェンス)作成 (PostGIS) | 未着手 |
| 3 | リアルタイム位置同期(背景取得・最適化) | 未着手 |
| 4 | 試合ロジック・鬼交代判定の本実装 | 未着手 |
| 5 | 安全機能(通報/ブロック/位置丸め) | 未着手 |
| 6 | SNS(募集/戦績/軌跡/リプレイ) | 未着手 |
| 7 | ベータ・負荷/電池検証 | 未着手 |

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
