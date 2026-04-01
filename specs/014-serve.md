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
| `--port <number>` | 待受ポート番号 | `4979`     |

## 動作

1. 指定されたポートでHTTPサーバーを起動する。指定されたポートが使用中の場合は、次のポートを順に試し、空きポートで起動する。最大10ポートまで試行する。
2. 起動後、`Listening on http://localhost:<port>` をログ出力する（実際に使用されたポート番号を表示する）。
3. `/api/*` へのリクエストはAPIハンドラーに委譲する。
4. `/main.js` へのリクエストはSPAのJavaScriptを返す。
5. それ以外のすべてのリクエストには `index.html` を返す（クライアントサイドルーティング対応）。

## APIエンドポイント

### GET /api/tasks/:id

指定したIDのタスク詳細をJSON形式で返す。

#### レスポンス（成功時）

```json
{
  "id": 1,
  "title": "タスク",
  "status": "todo",
  "body": "タスクの本文\n"
}
```

HTTP 200 を返す。

#### レスポンス（タスクが存在しない場合）

HTTP 404 を返す。

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
Listening on http://localhost:4979

$ task serve --port 8080
Listening on http://localhost:8080

$ task serve --port 4979  # 4979が使用中の場合
Listening on http://localhost:4980
```
