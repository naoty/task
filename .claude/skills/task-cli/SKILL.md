---
name: task-cli
description: naoty/task CLIを使った開発タスク管理スキル。このプロジェクトの開発タスクを確認・作成・更新するときに使う。「タスク」「次のタスク」「進行中」「完了」などのキーワードが出たら積極的に使うこと。
---

# task-cli

このプロジェクトの開発タスクを管理するCLIツール (`./build/task`) を活用する。

## 出力形式

すべてのコマンドはJSON形式で出力する。

- 成功時: `{ "ok": true, "result": { ... } }`（exit code: 0）
- 失敗時: `{ "ok": false, "error": { "message": "...", "usage": "...", "retriable": false } }`（exit code: 1）

## コマンドリファレンス

```
task next
task list
task add <title> [--parent <id>] [--body <content>]
task update <id> --<field> <value>...
task delete <id>
task move <id> [<number>] [--parent <parent-id>]
task dep add <id> <dependency-id>...
task dep delete <id> <dependency-id>...
task archive
```

## 主なユースケース

### 次のタスクを確認する

```
./build/task next
```

深さ優先（子→親の順）で走査し、すべての依存先が `done` またはアーカイブ済みである最初の `todo` タスクを返す。
対象タスクがない場合は `result.task` が `null`。

### タスク一覧を確認する

```
./build/task list
```

ルートレベルのタスクを `result.tasks` 配列で返す。各タスクは `children` フィールドを持ち、子タスクを再帰的に含む。

### タスクを作成する

```
./build/task add "タスクのタイトル"
./build/task add "サブタスク" --parent <parent-id>
./build/task add "タスク" --body "詳細説明"
```

作成したタスクのIDを `result.id` で返す。

### タスクを更新する

```
./build/task update <id> --status doing     # 作業開始
./build/task update <id> --status done      # 完了（子孫タスクもすべて done になる）
./build/task update <id> --title "新タイトル" --status doing  # 複数フィールド同時更新
./build/task update <id> --deadline 2026-03-31  # 任意フィールドも設定可能
```

`status` の有効な値: `todo`, `doing`, `done`

`parent` と `dependencies` は `update` では変更できない。それぞれ `move --parent` と `dep add/delete` を使う。

### タスクを削除する

```
./build/task delete <id>
```

子タスクも再帰的に削除する。削除したすべてのIDを `result.ids` で返す。

### 優先順位・親タスクを変更する

```
./build/task move <id> <number>              # 現在の兄弟リスト内で順番を変更（1始まり）
./build/task move <id> --parent <parent-id>  # 親を変更（新しい親の末尾に追加）
./build/task move <id> <number> --parent <parent-id>  # 両方同時に変更
./build/task move <id>                       # root の末尾に移動
```

`<number>` が範囲外の場合は先頭/末尾にクランプされる。依存関係は移動後も保持される。

### 依存関係を管理する

```
./build/task dep add <id> <dep-id>...     # 依存関係を追加（冪等・複数指定可）
./build/task dep delete <id> <dep-id>...  # 依存関係を削除（冪等・複数指定可）
```

`dep add` は循環依存・自己依存をバリデーションで弾く。
`dep delete` は存在しない依存関係は無視する。

### 完了タスクをアーカイブする

```
./build/task archive
```

`status: done` のタスクをインデックスから除外する（ファイルは残る）。
done タスクの子タスクのうち `done` でないものは root に昇格し、`done` のものは一緒にアーカイブされる。

## 注意事項

- タスクの削除は `./build/task delete <id>` を使う（`rm` で直接削除すると `index.json` と不整合が起きる）
- 親タスクの変更は `task update` ではなく `task move --parent <id>` を使う
- 依存関係の変更は `task update` ではなく `task dep add` / `task dep delete` を使う
