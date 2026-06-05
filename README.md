# Oni 🏃 — リアル空間 鬼ごっこ SNS

不特定多数が参加し、リアル空間で鬼ごっこを行う位置ゲーム/SNS アプリ。
GPS で参加し、ジオフェンスで鬼と逃走者が一定距離(既定 10m)まで近づくと
**鬼が自動で切り替わる**のがコアルール。

> ステータス: **Phase 0(基盤構築)完了**。詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## コンセプト

地図上に参加者がリアルタイム表示され、鬼が逃走者に物理的に接近すると
自動タッチ判定で役割交代。試合後は移動軌跡のリプレイや戦績を SNS として
共有・募集できる。

## モノレポ構成

```
packages/shared/   共通の型・定数・地理計算・鬼交代判定・WSイベント契約
apps/api/          Node + Express + WebSocket + PostgreSQL/PostGIS
apps/mobile/       React Native (Expo)
docs/              アーキテクチャ・設計ドキュメント
```

## セットアップ

```bash
npm install
psql "$DATABASE_URL" -f apps/api/db/schema.sql   # PostGIS スキーマ適用
npm run dev   -w @oni/api                        # API 起動
npm run start -w @oni/mobile                     # モバイル起動 (Expo)
npm test && npm run typecheck                    # テスト・型チェック
```

## 安全・プライバシー(設計原則)

不特定多数 × 位置情報のため安全設計を最優先する。

- 試合外は正確な座標を他人に出さない(粗く丸める)
- 位置生ログは短期保持で定期削除、共有軌跡は粗く丸める
- 通報・ブロック・年齢確認・夜間制限・危険ゾーン回避(Phase 5)

実装ロードマップは [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照。

---

## 開発ツール: Everything Claude Code (ECC)

このリポジトリは [ECC](https://github.com/affaan-m/ECC) を Claude Code プラグインとして
有効化しています(`.claude/settings.json` の `extraKnownMarketplaces` / `enabledPlugins`)。
これにより `/ecc:plan`、`/ecc:code-review`、`/ecc:tdd-workflow` などの
スラッシュコマンド・エージェント・スキルが利用できます。

> ECC のスラッシュコマンドは **`/ecc:` プレフィックス付き**で呼び出します
> (素の `/plan` ではなく `/ecc:plan`)。
>
> ルールはプラグインで自動配布されないため、必要に応じて
> `~/.claude/rules/ecc/` へ手動コピーしてください。
