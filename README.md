# 20260605_test

このリポジトリは [Everything Claude Code (ECC)](https://github.com/affaan-m/ECC) を
Claude Code プラグインとして利用するよう設定されています。

## ECC とは

ECC は Claude Code 向けの "harness-native operator system" で、以下を提供します。

- **Agents**: 63 個の専門サブエージェント(planner / architect / code-reviewer / security-reviewer など)
- **Skills**: 251 個のワークフロー定義
- **Commands**: 79 個のスラッシュコマンド(`/plan`, `/code-review`, `/build-fix`, `/quality-gate` など)
- **Rules**: 言語別・共通のガイドライン
- **Hooks**: ツールイベント連動の自動化(自動フォーマット、セッション永続化など)

## 設定内容

`.claude/settings.json` に ECC マーケットプレイスとプラグインを登録済みです。

```json
{
  "extraKnownMarketplaces": {
    "ecc": {
      "source": {
        "source": "github",
        "repo": "affaan-m/ECC"
      }
    }
  },
  "enabledPlugins": {
    "ecc@ecc": true
  }
}
```

この設定により、Claude Code はリポジトリを開いた際に ECC プラグイン
(skills / commands / hooks)を自動で読み込みます。

## 手動セットアップ(任意)

Claude Code のプラグインは **rules を自動配布できません**。
ECC のルールも使いたい場合は、別途コピーしてください。

```bash
# ECC リポジトリを取得後
mkdir -p ~/.claude/rules/ecc
cp -r rules/common ~/.claude/rules/ecc/
cp -r rules/typescript ~/.claude/rules/ecc/   # 必要な言語ディレクトリを追加
```

> プラグインインストール後に `./install.sh --profile full` は実行しないでください。
> プラグインが既に ECC の skills / commands / hooks を読み込みます。

## 参考リンク

- ECC リポジトリ: https://github.com/affaan-m/ECC
- ECC 公式サイト: https://ecc.tools
- 日本語 README: https://github.com/affaan-m/ECC/blob/main/docs/ja-JP/README.md
