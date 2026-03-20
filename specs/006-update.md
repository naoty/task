# `update` コマンド仕様

## 概要

タスクのフィールドを更新するコマンド。

## 書式

```
task update <id> [--title <title>] [--status <status>]
```

## 引数・オプション

| 引数/オプション | 必須 | 説明 |
| --- | --- | --- |
| `<id>` | 必須 | 更新するタスクのID |
| `--title <title>` | 任意 | 新しいタイトル |
| `--status <status>` | 任意 | 新しいステータス（`todo` / `doing` / `done`） |

## 動作

1. `<id>` が指定されていない場合はエラーを出力して終了する。
2. オプションが1つも指定されていない場合はエラーを出力して終了する。
3. `--status` が指定された場合、値が `todo` / `doing` / `done` のいずれでもなければエラーを出力して終了する。
4. `~/.tasks/<id>.md` が存在しない場合はエラーを出力して終了する。
5. 指定されたオプションに対応するフィールドを更新して `~/.tasks/<id>.md` を上書き保存する。
6. 更新後のタスクを出力する。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.task` に更新後のタスクを含む。

```json
{ "ok": true, "result": { "task": { "id": 1, "title": "買い物をする", "status": "done" } } }
```

### 異常系

| 条件 | `error.message` | `error.usage` | `error.retriable` |
| --- | --- | --- | --- |
| `<id>` が指定されていない | `id is required` | `task update <id> [--title <title>] [--status <status>]` | `false` |
| オプションが何も指定されていない | `at least one option is required` | `task update <id> [--title <title>] [--status <status>]` | `false` |
| `--status` の値が無効 | `invalid status: <value>` | `task update <id> [--title <title>] [--status <status>]` | `false` |
| 指定したIDのタスクが存在しない | `task not found: <id>` | `null` | `false` |

## 使用例

```
$ task update 1 --status done
{ "ok": true, "result": { "task": { "id": 1, "title": "買い物をする", "status": "done" } } }
```

```
$ task update 1 --title "買い物と掃除をする" --status doing
{ "ok": true, "result": { "task": { "id": 1, "title": "買い物と掃除をする", "status": "doing" } } }
```

```
$ task update 1
{ "ok": false, "error": { "message": "at least one option is required", "usage": "task update <id> [--title <title>] [--status <status>]", "retriable": false } }
```

```
$ task update 999 --status done
{ "ok": false, "error": { "message": "task not found: 999", "usage": null, "retriable": false } }
```
