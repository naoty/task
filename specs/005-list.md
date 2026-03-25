# `list` コマンド仕様

## 概要

タスクの一覧を出力するコマンド。

## 書式

```
task list
```

## 動作

1. インデックスファイルを読み込む。
2. `children["root"]` のタスクIDをルートタスクとして読み込む。
3. 各タスクの `children[id]` を再帰的に読み込み、入れ子構造で返す。
4. インデックスに含まれるタスクのみを対象とする。インデックスに含まれないタスクは表示しない。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.tasks` にルートレベルのタスクの配列を含む。各タスクは `children` フィールドを持ち、子タスクを再帰的に入れ子で含める（子がない場合は空配列）。タスクが0件の場合は空の配列を返す。frontmatterのすべてのフィールドを返す。

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
        "path": "/home/user/.tasks/1.md",
        "children": [
          {
            "id": 3,
            "title": "買い物リストを作る",
            "status": "todo",
            "path": "/home/user/.tasks/3.md",
            "children": []
          }
        ]
      },
      {
        "id": 2,
        "title": "掃除をする",
        "status": "done",
        "path": "/home/user/.tasks/2.md",
        "children": []
      }
    ]
  }
}
```

## 使用例

```
$ task list
{ "ok": true, "result": { "tasks": [{ "id": 1, "title": "買い物をする", "status": "todo", "deadline": "2026-03-31", "path": "/home/user/.tasks/1.md", "children": [{ "id": 3, "title": "買い物リストを作る", "status": "todo", "path": "/home/user/.tasks/3.md", "children": [] }] }, { "id": 2, "title": "掃除をする", "status": "done", "path": "/home/user/.tasks/2.md", "children": [] }] } }
```
