# `list` コマンド仕様

## 概要

タスクの一覧を出力するコマンド。

## 書式

```
task list
```

## 動作

1. インデックスファイルを読み込む。
2. インデックスに含まれるタスクのみを、インデックスファイル仕様（`003-index-file.md`）の優先順位の順で読み込む。
3. インデックスに含まれないタスクは表示しない。
4. タスク一覧を出力する。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.tasks` にタスクの配列を含む。タスクが0件の場合は空の配列を返す。frontmatterのすべてのフィールドを返す。

```json
{
  "ok": true,
  "result": {
    "tasks": [
      {
        "id": 1,
        "title": "買い物をする",
        "status": "todo",
        "deadline": "2026-03-31",
        "path": "/home/user/.tasks/1.md"
      },
      { "id": 2, "title": "掃除をする", "status": "done", "path": "/home/user/.tasks/2.md" }
    ]
  }
}
```

## 使用例

```
$ task list
{ "ok": true, "result": { "tasks": [{ "id": 1, "title": "買い物をする", "status": "todo", "deadline": "2026-03-31", "path": "/home/user/.tasks/1.md" }, { "id": 2, "title": "掃除をする", "status": "done", "path": "/home/user/.tasks/2.md" }] } }
```
