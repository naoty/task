#!/usr/bin/env node

import cac from "cac";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { version } from "../../package.json" with { type: "json" };
import { add } from "../commands/add";
import { deleteTask } from "../commands/delete";
import { list } from "../commands/list";
import { moveTask } from "../commands/move";
import { next } from "../commands/next";
import { updateTask } from "../commands/update";

function getTaskDir(): string {
  return process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
}

function respondSuccess(result: unknown): never {
  console.log(JSON.stringify({ ok: true, result }));
  process.exit(0);
}

function respondError(message: string, usage: string | null = null): never {
  console.log(JSON.stringify({ ok: false, error: { message, usage, retriable: false } }));
  process.exit(1);
}

function respondException(e: unknown): never {
  respondError(e instanceof Error ? e.message : String(e));
}

const cli = cac("task");

cli.option("-v, --version", "バージョンを表示する");
cli.help();

cli.command("add [title]", "タスクを作成する").action(async (title?: string) => {
  if (!title) respondError("title is required", "task add <title>");

  const result = await add(title, getTaskDir());
  respondSuccess(result);
});

cli.command("next", "次にやるべきタスクを返す").action(async () => {
  const result = await next(getTaskDir());
  respondSuccess(result);
});

cli.command("list", "タスク一覧を表示する").action(async () => {
  const result = await list(getTaskDir());
  respondSuccess(result);
});

cli.command("delete [id]", "タスクを削除する").action(async (id?: string) => {
  if (!id) respondError("id is required", "task delete <id>");

  try {
    const result = await deleteTask(parseInt(id, 10), getTaskDir());
    respondSuccess(result);
  } catch (e) {
    respondException(e);
  }
});

cli
  .command("update [id]", "タスクを更新する")
  .allowUnknownOptions()
  .action(async (id?: string, options: Record<string, unknown> = {}) => {
    if (!id) {
      respondError("id is required", "task update <id> --<field> <value> [--<field> <value>...]");
    }

    const {
      help: _help,
      h: _h,
      version: _version,
      v: _v,
      "--": _rest,
      ...updates
    } = options as Record<string, unknown>;
    const stringUpdates = Object.fromEntries(
      Object.entries(updates).map(([k, val]) => [k, String(val)]),
    );

    if (Object.keys(stringUpdates).length === 0) {
      respondError(
        "at least one option is required",
        "task update <id> --<field> <value> [--<field> <value>...]",
      );
    }

    try {
      const task = await updateTask(parseInt(id, 10), stringUpdates, getTaskDir());
      respondSuccess({ task });
    } catch (e) {
      respondException(e);
    }
  });

cli.command("move [id] [number]", "タスクの優先順位を変更する").action(async (id?: string, number?: string) => {
  if (!id || !number) respondError("id and number are required", "task move <id> <number>");

  try {
    const task = await moveTask(parseInt(id, 10), parseInt(number, 10), getTaskDir());
    respondSuccess({ task });
  } catch (e) {
    respondException(e);
  }
});

const { options } = cli.parse();

if (options.version) {
  console.log(version);
  process.exit(0);
}
