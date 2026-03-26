# `move` コマンド仕様

## 概要

タスクの優先順位や親タスクを変更するコマンド。

## 書式

```
task move <id> [<number>] [--parent <parent-id>]
```

| 引数/オプション        | 必須 | 説明                                             |
| ---------------------- | ---- | ------------------------------------------------ |
| `<id>`                 | 必須 | 移動するタスクのID                               |
| `<number>`             | 任意 | 移動先の順番（1始まり）。省略時は末尾            |
| `--parent <parent-id>` | 任意 | 新しい親タスクのID。指定すると親タスクを変更する |

## 動作

1. `<id>` に対応するタスクファイルが存在するか確認する。存在しない場合はエラー。
2. インデックスファイルを読み込む。
3. 以下の場合分けで処理する:
   - **`<number>` も `--parent` も省略**: `id` を現在の兄弟リストから取り除き、`children["root"]` の末尾に追加する（ルートに移動）。
   - **`<number>` のみ指定**: タスクの兄弟リスト（`children["root"]` またはは `children[parentId]`）内で `id` を `<number>` の位置に移動する。
   - **`--parent <parent-id>` のみ指定**: 親タスクの存在確認・親子関係の循環参照チェック後、`id` を現在の兄弟リストから取り除き、`children[parent-id]` の末尾に追加する。
   - **`<number>` と `--parent <parent-id>` の両方指定**: 親タスクの存在確認・親子関係の循環参照チェック後、`id` を現在の兄弟リストから取り除き、`children[parent-id]` の `<number>` の位置に挿入する。
4. `<number>` が1未満の場合は先頭（位置1）に挿入する。`<number>` がリストの長さを超える場合は末尾に挿入する。
5. インデックスファイルを更新する。

> **循環参照チェックの対象について**: `--parent` 指定時の循環参照チェックは、`children` フィールドで管理される**親子関係のみ**を対象とする。`dependencies` フィールドで管理される依存関係は対象外。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.task` に移動後のタスク情報を含む。frontmatterのすべてのフィールドを返す。

```json
{
  "ok": true,
  "result": {
    "task": { "id": 1, "title": "買い物をする", "status": "todo", "path": "/home/user/.tasks/1.md" }
  }
}
```

### 異常系

| 条件                                | `error.message`                               | `error.usage` | `error.retriable` |
| ----------------------------------- | --------------------------------------------- | ------------- | ----------------- |
| タスクが存在しない                  | `Task <id> not found`                         | `null`        | `false`           |
| `--parent` で指定したIDが存在しない | `Task <id> not found`                         | `null`        | `false`           |
| 親子関係の循環参照になる場合        | `Circular parent-child relationship detected` | `null`        | `false`           |

## 使用例

```
$ task move 2 1
{ "ok": true, "result": { "task": { "id": 2, ... } } }

$ task move 3 --parent 1
{ "ok": true, "result": { "task": { "id": 3, ... } } }

$ task move 3 1 --parent 1
{ "ok": true, "result": { "task": { "id": 3, ... } } }

$ task move 3
{ "ok": true, "result": { "task": { "id": 3, ... } } }
```
