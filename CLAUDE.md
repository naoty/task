# ワークフロー
1. `./build/task-linux-x64 next` で次のタスクを確認する。
2. `./build/task-linux-x64 update <id> --status doing` でタスクを進行中に更新する。
3. worktreeを `.claude/worktrees/` 以下に作成して、以下はworktreeで作業する。
4. plan modeで変更の計画をコミット単位で立て、ユーザーから承認を得る。
5. 計画したコミット単位で以下のように進める。
  a. 仕様駆動開発に沿って、まずは仕様書を作成/更新し、受け入れテストを書いて、それを満たすように実装する。
  b. `vp test` と `vp check` がすべてパスすることを確認する。
  c. 作業ログをタスクファイルに記入する。
  d. コミットする。
6. すべてのコミットが完了したらPull Requestを作成する。
7. ユーザーからPull Requestをmergeした連絡を受けたらworktreeを削除する。
8. `./build/task-linux-x64 update <id> --status done` でタスクを完了に更新する。

# ディレクトリ構成

- `specs/`: 仕様書
- `src/`: 実装
- `tests/`: 受け入れテスト（仕様書と対応するファイル名にする）

# 技術方針

## 技術スタック

- 言語: TypeScript
- ランタイム: Node.js
- パッケージ管理: pnpm
- ツールキット: Vite+
- Web UI: React Router（メタフレームワークとして使用し、APIサーバーも兼ねる）

## アーキテクチャ

- エージェント向けのCLIと人間向けのWeb UIを提供し、タスクの閲覧や操作をおこなう。
- タスクごとにfrontmatter付きのmarkdownファイルを保存する。
- タスク間の関係性をJSONファイルに保存する。

# 作業ログの書き方

タスクファイル（`~/.tasks/<id>.md`）のfrontmatterの直下に `# 作業ログ` セクションを作成し、今日の日付のサブセクションを追加する。

```markdown
# 作業ログ

## 2026-03-23

- 仕様書を読んで実装方針を決めた
```

- 日付ごとに `## YYYY-MM-DD` のサブセクションを作成する
- 1つの作業につき1行、箇条書きで追記する

