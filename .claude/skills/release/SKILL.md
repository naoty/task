---
name: release
description: リリースワークフロースキル。バージョン決定・CHANGELOG生成・タグ作成・GitHub Releaseまでを一括サポート。「リリース」「changelog」「バージョン」「release」などのキーワードが出たら積極的に使うこと。
---

# release

リリース関連のワークフローをサポートする。コミットログをエージェントが読んで意味のある変更履歴として整理し、CHANGELOG.mdを生成・更新する。

## ワークフロー

### 1. 現在の状態を確認する

```bash
# 現在のバージョン
cat package.json | jq -r '.version'

# 前回のタグ
git tag --sort=-version:refname | head -5

# 前回タグ以降のコミット（タグがない場合は全コミット）
git log <last-tag>..HEAD --oneline
# または（初回リリース）
git log --oneline
```

### 2. バージョンを決める

Conventional Commits の規約に基づいて bump を判断する：

- `feat:` を含むコミットがある → **minor** bump（例: 0.1.0 → 0.2.0）
- `fix:` / `perf:` / `refactor:` のみ → **patch** bump（例: 0.1.0 → 0.1.1）
- `BREAKING CHANGE:` を含むコミットがある → **major** bump（例: 0.1.0 → 1.0.0）

ユーザーに提案してから最終バージョンを確定する。

### 3. CHANGELOGを生成する（Claudeが整理）

コミットを機械的に列挙せず、以下の観点で整理する：

- **カテゴリ分類**: Features / Bug Fixes / Improvements / Internal
- **グループ化**: 同じ機能に関する複数のコミット（feat + 後続のfix等）は1エントリにまとめる
- **ユーザー視点の文章**: コミットメッセージの実装詳細ではなく、ユーザーにとって何が変わったかを書く
- **省略**: 純粋なリファクタリング・スタイル修正・CI変更など、ユーザーに影響しない変更は省略するか "Internal" にまとめる

CHANGELOG.md の形式：

```markdown
# Changelog

## [0.2.0] - 2026-03-29

### Features

- タスクの依存関係を視覚的なグラフで表示できるようになりました

### Bug Fixes

- ノードのレイアウトが正しく計算されない問題を修正しました

## [0.1.0] - 2026-01-01

...
```

### 4. ファイルを更新する

1. `CHANGELOG.md` を作成/更新（新バージョンを先頭に追記）
2. `package.json` の `version` フィールドを更新

### 5. mainブランチの状態を確認する

リリースコミットを作る前に、すべての変更が `main` にマージ済みであることを確認する。

```bash
# オープン中のPRがないか確認
gh pr list

# ローカルの main が origin/main と一致しているか確認
git fetch origin
git log origin/main..HEAD --oneline  # 出力がなければOK
```

未マージのPRや、originと乖離がある場合はリリースを中断してユーザーに確認する。

### 6. コミット・タグ・push

```bash
# 変更をコミット
git add CHANGELOG.md package.json
git commit -m "chore: release v<version>"

# タグを作成
git tag v<version>

# push（GitHub Actions がタグをトリガーにリリースを作成する）
git push origin main --tags
```

## 注意事項

- CHANGELOGはユーザーが読むドキュメント。実装都合のコミットをそのまま転記しない
- バージョンはリリース前に必ずユーザーに確認する
- `main` ブランチで直接リリースコミットを行う（リリース専用ブランチは不要）
- GitHub Release の作成は GitHub Actions ワークフローが行う。`gh release create` は実行しない（タグ push でワークフローが自動トリガーされる）
