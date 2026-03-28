# `task serve` コマンド仕様

## 概要

HTTPサーバーを起動し、Web UIを配信する。

## 書式

```
task serve [--port <number>]
```

## オプション

| オプション        | 説明           | デフォルト |
| ----------------- | -------------- | ---------- |
| `--port <number>` | 待受ポート番号 | `3000`     |

## 動作

1. 指定されたポートでHTTPサーバーを起動する。
2. 起動後、`Listening on http://localhost:<port>` をログ出力する。
3. `/api/*` へのリクエストはAPIハンドラーに委譲する。
4. `/main.js` へのリクエストはSPAのJavaScriptを返す。
5. それ以外のすべてのリクエストには `index.html` を返す（クライアントサイドルーティング対応）。

## APIエンドポイント

### GET /api/tasks

タスクの一覧をJSON形式で返す。

#### レスポンス

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "タスク",
      "status": "todo",
      "children": []
    }
  ]
}
```

HTTP 200 を返す。

## 出力

起動時にプレーンテキストでログを出力する。

```
Listening on http://localhost:3000
```

## 使用例

```
$ task serve
Listening on http://localhost:3000

$ task serve --port 8080
Listening on http://localhost:8080
```
