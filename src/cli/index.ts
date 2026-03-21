#!/usr/bin/env node

import cac from "cac";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { version } from "../../package.json" with { type: "json" };
import { add } from "../commands/add";
import { deleteTask } from "../commands/delete";
import { list } from "../commands/list";
import { next } from "../commands/next";
import { updateTask } from "../commands/update";

const cli = cac("task");

cli.option("-v, --version", "バージョンを表示する");
cli.help();

cli.command("add [title]", "タスクを作成する").action(async (title?: string) => {
  if (!title) {
    console.log(
      JSON.stringify({
        ok: false,
        error: {
          message: "title is required",
          usage: "task add <title>",
          retriable: false,
        },
      }),
    );
    process.exit(1);
  }

  const taskDir = process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
  const result = await add(title, taskDir);
  console.log(JSON.stringify({ ok: true, result }));
  process.exit(0);
});

cli.command("next", "次にやるべきタスクを返す").action(async () => {
  const taskDir = process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
  const result = await next(taskDir);
  console.log(JSON.stringify({ ok: true, result }));
  process.exit(0);
});

cli.command("list", "タスク一覧を表示する").action(async () => {
  const taskDir = process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
  const result = await list(taskDir);
  console.log(JSON.stringify({ ok: true, result }));
  process.exit(0);
});

cli.command("delete [id]", "タスクを削除する").action(async (id?: string) => {
  if (!id) {
    console.log(
      JSON.stringify({
        ok: false,
        error: {
          message: "id is required",
          usage: "task delete <id>",
          retriable: false,
        },
      }),
    );
    process.exit(1);
  }

  const taskDir = process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
  try {
    const result = await deleteTask(parseInt(id, 10), taskDir);
    console.log(JSON.stringify({ ok: true, result }));
    process.exit(0);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(
      JSON.stringify({
        ok: false,
        error: { message, usage: null, retriable: false },
      }),
    );
    process.exit(1);
  }
});

cli
  .command("update [id]", "タスクを更新する")
  .action(async (id?: string, options: Record<string, unknown> = {}) => {
    if (!id) {
      console.log(
        JSON.stringify({
          ok: false,
          error: {
            message: "id is required",
            usage: "task update <id> --<field> <value> [--<field> <value>...]",
            retriable: false,
          },
        }),
      );
      process.exit(1);
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
      console.log(
        JSON.stringify({
          ok: false,
          error: {
            message: "at least one option is required",
            usage: "task update <id> --<field> <value> [--<field> <value>...]",
            retriable: false,
          },
        }),
      );
      process.exit(1);
    }

    const taskDir = process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
    try {
      const task = await updateTask(parseInt(id, 10), stringUpdates, taskDir);
      console.log(JSON.stringify({ ok: true, result: { task } }));
      process.exit(0);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(
        JSON.stringify({
          ok: false,
          error: { message, usage: null, retriable: false },
        }),
      );
      process.exit(1);
    }
  });

const { options } = cli.parse();

if (options.version) {
  console.log(version);
  process.exit(0);
}
