# `list` コマンド仕様

## 概要

タスクの一覧を出力するコマンド。

## 書式

```
task list
```

## 動作

1. `~/.tasks/` ディレクトリ内の `.md` ファイルを読み込む。
2. インデックスファイル仕様（`003-index-file.md`）に従い、優先順位の順でソートする。
3. タスク一覧を出力する。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.tasks` にタスクの配列を含む。タスクが0件の場合は空の配列を返す。frontmatterのすべてのフィールドを返す。

```json
{
  "ok": true,
  "result": {
    "tasks": [
      { "id": 1, "title": "買い物をする", "status": "todo", "deadline": "2026-03-31" },
      { "id": 2, "title": "掃除をする", "status": "done" }
    ]
  }
}
```

## 使用例

```
$ task list
{ "ok": true, "result": { "tasks": [{ "id": 1, "title": "買い物をする", "status": "todo", "deadline": "2026-03-31" }, { "id": 2, "title": "掃除をする", "status": "done" }] } }
```
