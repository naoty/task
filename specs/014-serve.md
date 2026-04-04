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
4. `/index.js` へのリクエストはSPAのJavaScriptを返す。
5. `/index.css` へのリクエストはSPAのCSSを返す。
6. それ以外のすべてのリクエストには `index.html` を返す（クライアントサイドルーティング対応）。

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

### PATCH /api/tasks/:id

指定したIDのタスクを更新し、更新後のタスク詳細をJSON形式で返す。

#### リクエストボディ

```json
{
  "title": "新しいタイトル",
  "status": "doing",
  "body": "新しい本文\n"
}
```

すべてのフィールドは省略可能。指定されたフィールドのみ更新する。

#### レスポンス（成功時）

```json
{
  "id": 1,
  "title": "新しいタイトル",
  "status": "doing",
  "body": "新しい本文\n"
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

### GET /api/graph

グラフビュー用のデータをJSON形式で返す。ノード一覧・エッジ一覧・ルート順序を含む。

#### レスポンス

```json
{
  "nodes": [
    { "id": "1", "title": "タスク", "status": "todo" }
  ],
  "edges": [
    { "id": "dep-1-2", "source": "1", "target": "2", "type": "dependency" },
    { "id": "parent-1-3", "source": "1", "target": "3", "type": "parent-child" }
  ],
  "rootOrder": ["1", "2"]
}
```

- `nodes`: アーカイブされていないタスクの一覧
- `edges.type`:
  - `dependency`: 依存関係（`source` が完了しないと `target` を開始できない）
  - `parent-child`: 親子関係（`source` が親、`target` が子）
- `rootOrder`: ルートレベルのタスクIDを順番に並べた配列

HTTP 200 を返す。

### GET /api/events

タスクディレクトリの変更を通知するSSE（Server-Sent Events）エンドポイント。

#### レスポンス

```
Content-Type: text/event-stream

data: change
```

タスクディレクトリにファイルの変更があるたびに `data: change` イベントを送信する。

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
