# `next` コマンド仕様

## 概要

次にやるべきタスクを1件返すコマンド。エージェントがタスクをループ処理する際に使用する。

## 書式

```
task next
```

## 動作

1. インデックスファイル仕様（`003-index-file.md`）に従い、優先順位順にタスクを参照する。
2. ステータスが `todo` の最初のタスクを返す。
3. `todo` のタスクが存在しない場合は `result.task` を `null` として返す。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.task` に該当タスクを含む。`todo` のタスクがない場合は `null`。frontmatterのすべてのフィールドを返す。

```json
{ "ok": true, "result": { "task": { "id": 3, "title": "買い物をする", "status": "todo", "deadline": "2026-03-31" } } }
```

```json
{ "ok": true, "result": { "task": null } }
```

## 使用例

```
$ task next
{ "ok": true, "result": { "task": { "id": 3, "title": "買い物をする", "status": "todo", "deadline": "2026-03-31" } } }
```

```
$ task next
{ "ok": true, "result": { "task": null } }
```
