# `move` コマンド仕様

## 概要

タスクの優先順位を変更するコマンド。インデックスファイル内のタスクIDの並び順を変更することで優先順位を変更する。

## 書式

```
task move <id> <number>
```

| 引数       | 型   | 説明                                   |
| ---------- | ---- | -------------------------------------- |
| `<id>`     | 整数 | 移動するタスクのID                     |
| `<number>` | 整数 | 移動先の順番（1始まり）。1が最高優先度 |

## 動作

1. `<id>` に対応するタスクファイルが存在するか確認する。存在しない場合はエラー。
2. インデックスファイルを読み込む。
3. インデックスから `<id>` を取り除く。
4. `<number>` の位置に `<id>` を挿入する。
   - `<number>` が1未満の場合は先頭（位置1）に挿入する。
   - `<number>` がインデックスの長さを超える場合は末尾に挿入する。
5. インデックスファイルを更新する。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.task` に移動後のタスク情報を含む。frontmatterのすべてのフィールドを返す。

```json
{
  "ok": true,
  "result": {
    "task": { "id": 1, "title": "買い物をする", "status": "todo" }
  }
}
```

### 異常系

#### タスクが存在しない場合

```json
{
  "ok": false,
  "error": {
    "message": "Task 99 not found",
    "usage": null,
    "retriable": false
  }
}
```

#### 引数が不足・不正な場合

```json
{
  "ok": false,
  "error": {
    "message": "Invalid arguments",
    "usage": "task move <id> <number>",
    "retriable": false
  }
}
```

## 使用例

```
$ task list
{ "ok": true, "result": { "tasks": [{ "id": 3, ... }, { "id": 1, ... }, { "id": 2, ... }] } }

$ task move 2 1
{ "ok": true, "result": { "task": { "id": 2, "title": "掃除をする", "status": "todo" } } }

$ task list
{ "ok": true, "result": { "tasks": [{ "id": 2, ... }, { "id": 3, ... }, { "id": 1, ... }] } }
```
