# `update` コマンド仕様

## 概要

タスクのフィールドを更新するコマンド。

## 書式

```
task update <id> --<field> <value> [--<field> <value>...]
```

## 引数・オプション

| 引数/オプション     | 必須        | 説明                                                                |
| ------------------- | ----------- | ------------------------------------------------------------------- |
| `<id>`              | 必須        | 更新するタスクのID                                                  |
| `--<field> <value>` | 1つ以上必須 | 更新するフィールド名と値。frontmatterの任意のフィールドを指定できる |

## フィールドのバリデーション

既知のフィールドには以下のバリデーションを適用する。

| フィールド | 有効な値                  |
| ---------- | ------------------------- |
| `status`   | `todo` / `doing` / `done` |

未知のフィールドはバリデーションなしでそのまま保存する。

## 動作

1. `<id>` が指定されていない場合はエラーを出力して終了する。
2. オプションが1つも指定されていない場合はエラーを出力して終了する。
3. フィールドのバリデーションに失敗した場合はエラーを出力して終了する。
4. `~/.tasks/<id>.md` が存在しない場合はエラーを出力して終了する。
5. 指定されたフィールドを更新して `~/.tasks/<id>.md` を上書き保存する。
6. 更新後のタスクを出力する。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.task` に更新後のタスクを含む。frontmatterのすべてのフィールドを返す。

```json
{
  "ok": true,
  "result": {
    "task": { "id": 1, "title": "買い物をする", "status": "done", "path": "/home/user/.tasks/1.md" }
  }
}
```

### 異常系

| 条件                                 | `error.message`                   | `error.usage`                                               | `error.retriable` |
| ------------------------------------ | --------------------------------- | ----------------------------------------------------------- | ----------------- |
| `<id>` が指定されていない            | `id is required`                  | `task update <id> --<field> <value> [--<field> <value>...]` | `false`           |
| オプションが何も指定されていない     | `at least one option is required` | `task update <id> --<field> <value> [--<field> <value>...]` | `false`           |
| フィールドのバリデーションに失敗した | `invalid <field>: <value>`        | `null`                                                      | `false`           |
| 指定したIDのタスクが存在しない       | `task not found: <id>`            | `null`                                                      | `false`           |

## 使用例

```
$ task update 1 --status done
{ "ok": true, "result": { "task": { "id": 1, "title": "買い物をする", "status": "done", "path": "/home/user/.tasks/1.md" } } }
```

```
$ task update 1 --title "買い物と掃除をする" --status doing
{ "ok": true, "result": { "task": { "id": 1, "title": "買い物と掃除をする", "status": "doing", "path": "/home/user/.tasks/1.md" } } }
```

```
$ task update 1 --deadline 2026-03-31
{ "ok": true, "result": { "task": { "id": 1, "title": "買い物をする", "status": "todo", "deadline": "2026-03-31", "path": "/home/user/.tasks/1.md" } } }
```

```
$ task update 1
{ "ok": false, "error": { "message": "at least one option is required", "usage": "task update <id> --<field> <value> [--<field> <value>...]", "retriable": false } }
```

```
$ task update 999 --status done
{ "ok": false, "error": { "message": "task not found: 999", "usage": null, "retriable": false } }
```
