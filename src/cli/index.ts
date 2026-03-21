#!/usr/bin/env node

import cac from "cac";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { version } from "../../package.json" with { type: "json" };
import { add } from "../commands/add.ts";
import { list } from "../commands/list.ts";

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

cli.command("list", "タスク一覧を表示する").action(async () => {
  const taskDir = process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
  const result = await list(taskDir);
  console.log(JSON.stringify({ ok: true, result }));
  process.exit(0);
});

const { options } = cli.parse();

if (options.version) {
  console.log(version);
  process.exit(0);
}
