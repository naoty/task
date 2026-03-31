# task

A task management CLI designed for AI agents and humans. All output is JSON, making it easy to integrate with LLMs and automation scripts.

## Features

- JSON output on all commands — agent-friendly by design
- Hierarchical tasks with parent/child relationships
- Task dependencies with smart `next` command
- Status tracking: `todo` / `doing` / `done`
- Tasks stored as Markdown files with frontmatter in `~/.tasks/`
- Web UI via `task serve`

## Installation

```sh
brew install naoty/misc/task
```

## Usage

### Add a task

```sh
$ task add "Buy groceries"
{"ok": true, "result": {"id": 1}}
```

```sh
$ task add "Make a shopping list" --parent 1
{"ok": true, "result": {"id": 2}}
```

### List tasks

```sh
$ task list
{
  "ok": true,
  "result": {
    "tasks": [
      {
        "id": 1,
        "title": "Buy groceries",
        "status": "todo",
        "children": [
          {
            "id": 2,
            "title": "Make a shopping list",
            "status": "todo",
            "children": []
          }
        ]
      }
    ]
  }
}
```

### Get the next task to work on

Returns the first unblocked `todo` task in depth-first order. Dependencies are respected — a task blocked by an incomplete dependency is skipped.

```sh
$ task next
{"ok": true, "result": {"task": {"id": 2, "title": "Make a shopping list", "status": "todo"}}}
```

### Update a task

```sh
$ task update 2 --status done
{"ok": true, "result": {"task": {"id": 2, "title": "Make a shopping list", "status": "done"}}}
```

```sh
$ task update 1 --deadline 2026-04-01
{"ok": true, "result": {"task": {"id": 1, "title": "Buy groceries", "status": "doing", "deadline": "2026-04-01"}}}
```

### Manage dependencies

```sh
$ task dep add 3 2   # task 3 depends on task 2
$ task dep delete 3 2
```

### Move a task

```sh
$ task move 2 --parent 1   # change parent
$ task move 2 1             # move to position 1 within siblings
```

### Archive completed tasks

```sh
$ task archive
```

### Delete a task

```sh
$ task delete 1
```

### Start the Web UI

```sh
$ task serve
Listening on http://localhost:4979
```

## Output format

Every command outputs JSON to stdout.

**Success:**
```json
{"ok": true, "result": {}}
```

**Error:**
```json
{"ok": false, "error": {"message": "task not found: 99", "usage": null, "retriable": false}}
```

The `retriable` field tells agents whether retrying the same command makes sense (e.g. a transient error vs. a bad argument).

## Task files

Tasks are stored as Markdown files with YAML frontmatter in `~/.tasks/`:

```markdown
---
id: 1
title: Buy groceries
status: todo
deadline: 2026-04-01
---

Optional body content here.
```
