# `dep delete` コマンド仕様

## 概要

タスクから依存関係を削除するコマンド。

## 書式

```
task dep delete <id> <dependency-id>...
```

| 引数            | 説明                                        |
| --------------- | ------------------------------------------- |
| `id`            | 依存を解除するタスクのID                    |
| `dependency-id` | 削除する依存先タスクのID（1つ以上、可変長） |

## 動作

1. インデックスファイルを読み込む。
2. `dependencies[id]` から指定した依存先IDを削除する。
3. 存在しない依存関係は無視する（冪等）。
4. `dependencies[id]` が空になった場合、そのエントリを削除する。
5. インデックスファイルを保存する。

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
    "usage": "task dep delete <id> <dependency-id>...",
    "retriable": false
  }
}
```

## 使用例

```
$ task dep delete 1 2
{ "ok": true, "result": {} }
```
