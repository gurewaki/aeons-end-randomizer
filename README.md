# Aeons End Randomizer

Aeons End のマーケット (サプライ) を所有拡張からランダム生成する Web アプリ。Next.js (App Router) + TypeScript + Tailwind CSS。GitHub Pages で公開。

## セットアップ

```bash
npm install
npm run build:data   # YAML → TS codegen (predev/prebuild/pretest で自動実行)
npm run dev          # http://localhost:3000
```

## カードデータの追加

`data/expansions/<expansion-id>.yaml` を追加すると次回 build/dev 時に自動取り込み。スキーマは既存ファイル参照。

## テスト

```bash
npm test
```

ランダム生成ロジックのみカバー。

## ビルドと静的サーブ

```bash
npm run build           # out/ に静的エクスポート
npx serve out           # ローカル静的確認 (本番 basePath 適用)
```

## GitHub Pages デプロイ

`.github/workflows/deploy.yml` が main への push で自動デプロイ。

**初回のみ手動操作**:
1. GitHub リポジトリ設定 → Pages → Source を **"GitHub Actions"** に切替
2. リポジトリ名が `aeons-end-randomizer` 以外の場合は `next.config.ts` の `repo` 定数を変更

公開後 URL: `https://<user>.github.io/aeons-end-randomizer/`

## 構成

```
app/                     # App Router (Client Component)
lib/types.ts             # Card / Expansion / MarketSupply 等
lib/randomizer/          # generateMarket / shuffle / errors
lib/data/                # codegen 出力 (gitignore)
data/expansions/*.yaml   # 拡張ごとのカードデータ
scripts/build-data.ts    # YAML → TS codegen
tests/                   # Vitest
```
