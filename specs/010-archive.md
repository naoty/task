# `archive` コマンド仕様

## 概要

完了したタスクをアーカイブするコマンド。インデックスファイルから `done` のタスクIDを取り除くことで、`task list` に表示されなくする。

## 書式

```
task archive
```

## 動作

1. インデックスファイルを読み込む。
2. `children` の全値からインデックス済みタスクを読み込み、`status` が `done` のものを抽出する。子タスクが `todo`/`doing` の状態であっても、親タスクが `done` であればアーカイブ対象とする。
3. `done` タスクのIDを `children` の値からも削除する。値が空になった非ルートキーは削除する。
4. `done` タスクのIDを `children` のキーから削除する。このとき、そのタスクの子タスクのうち `done` でないもの（`todo`/`doing`）は `children["root"]` の末尾に追加してルートレベルに移動する。`done` の子タスクはステップ2-3で同時にアーカイブされる。
5. `done` タスクのIDを `dependencies` の値からも削除する。値が空になったキーは削除する。
6. インデックスファイルを書き込む。
7. アーカイブしたタスクのファイル（`~/.tasks/<id>.md`）は削除しない。インデックスから除外されるが、ファイルとして残る。
8. アーカイブしたタスクの配列を返す。

## 出力

出力形式は共通仕様（`001-cli.md`）に従う。

### 正常系

`result.tasks` にアーカイブしたタスクの配列を含む。アーカイブ対象が0件の場合は空の配列を返す。

```json
{
  "ok": true,
  "result": {
    "tasks": [
      { "id": 1, "title": "買い物をする", "status": "done", "path": "/home/user/.tasks/1.md" }
    ]
  }
}
```

## 使用例

```
$ task archive
{ "ok": true, "result": { "tasks": [{ "id": 1, "title": "買い物をする", "status": "done", "path": "/home/user/.tasks/1.md" }] } }
```

```
$ task archive
{ "ok": true, "result": { "tasks": [] } }
```

子タスクが未完了（`todo`）の親タスクをアーカイブする場合、親タスクのみアーカイブされ、子タスクはルートレベルに移動する：

```
# Before: タスク1（done）の子にタスク2（todo）がある
$ task archive
{ "ok": true, "result": { "tasks": [{ "id": 1, "title": "親タスク", "status": "done", "path": "/home/user/.tasks/1.md" }] } }
# After: タスク2はルートレベルに移動する
```
