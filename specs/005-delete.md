# `delete` コマンド仕様

## 概要

タスクを削除するコマンド。

## 書式

```
task delete <id>
```

## 引数

| 引数   | 必須 | 説明             |
| ------ | ---- | ---------------- |
| `<id>` | 必須 | 削除するタスクのID |

## 動作

1. `<id>` が指定されていない場合はエラーを出力して終了する。
2. `~/.tasks/<id>.md` が存在しない場合はエラーを出力して終了する。
3. `~/.tasks/<id>.md` を削除する。
4. 削除したタスクのIDを出力する。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.id` に削除したタスクのIDを含む。

```json
{ "ok": true, "result": { "id": 1 } }
```

### 異常系

| 条件 | `error.message` | `error.usage` | `error.retriable` |
| --- | --- | --- | --- |
| `<id>` が指定されていない | `id is required` | `task delete <id>` | `false` |
| 指定したIDのタスクが存在しない | `task not found: <id>` | `null` | `false` |

## 使用例

```
$ task delete 1
{ "ok": true, "result": { "id": 1 } }
```

```
$ task delete
{ "ok": false, "error": { "message": "id is required", "usage": "task delete <id>", "retriable": false } }
```

```
$ task delete 999
{ "ok": false, "error": { "message": "task not found: 999", "usage": null, "retriable": false } }
```
