# `dep add` コマンド仕様

## 概要

タスクに依存関係を追加するコマンド。

## 書式

```
task dep add <id> <dependency-id>...
```

| 引数            | 説明                                |
| --------------- | ----------------------------------- |
| `id`            | 依存させるタスクのID                |
| `dependency-id` | 依存先タスクのID（1つ以上、可変長） |

## 動作

1. インデックスファイルを読み込む。
2. `dependencies[id]` に指定した依存先IDを追加する。
3. すでに存在する依存関係は無視する（冪等）。
4. インデックスファイルを保存する。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

```json
{ "ok": true, "result": {} }
```

### エラー系

#### 引数不足

```json
{
  "ok": false,
  "error": {
    "message": "id and dependency-id are required",
    "usage": "task dep add <id> <dependency-id>...",
    "retriable": false
  }
}
```

## 使用例

```
$ task dep add 1 2 3
{ "ok": true, "result": {} }
```
