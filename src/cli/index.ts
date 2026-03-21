#!/usr/bin/env node

import cac from "cac";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { version } from "../../package.json" with { type: "json" };
import { add } from "../commands/add.ts";
import { deleteTask } from "../commands/delete.ts";

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
      })
    );
    process.exit(1);
  }

  const taskDir = process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
  const result = await add(title, taskDir);
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
      })
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
      })
    );
    process.exit(1);
  }
});

const { options } = cli.parse();

if (options.version) {
  console.log(version);
  process.exit(0);
}
