import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { next } from "../src/commands/next";

let taskDir: string;

beforeEach(() => {
  taskDir = mkdtempSync(resolve(tmpdir(), "task-test-"));
});

afterEach(() => {
  rmSync(taskDir, { recursive: true, force: true });
});

test("todo のタスクがない場合、task を null で返す", async () => {
  const result = await next(taskDir);
  expect(result).toEqual({ task: null });
});

test("todo のタスクが1件ある場合、そのタスクを返す", async () => {
  writeFileSync(resolve(taskDir, "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir, "index.json"), JSON.stringify([1]));

  const result = await next(taskDir);
  expect(result).toEqual({ task: { id: 1, title: "タスク1", status: "todo" } });
});

test("done のタスクのみの場合、task を null で返す", async () => {
  writeFileSync(resolve(taskDir, "1.md"), "---\ntitle: タスク1\nstatus: done\n---\n");

  const result = await next(taskDir);
  expect(result).toEqual({ task: null });
});

test("インデックスの優先順位順で最初の todo タスクを返す", async () => {
  writeFileSync(resolve(taskDir, "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir, "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir, "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir, "index.json"), JSON.stringify([3, 1, 2]));

  const result = await next(taskDir);
  expect(result).toEqual({ task: { id: 3, title: "タスク3", status: "todo" } });
});

test("todo より前の done タスクをスキップして最初の todo タスクを返す", async () => {
  writeFileSync(resolve(taskDir, "1.md"), "---\ntitle: タスク1\nstatus: done\n---\n");
  writeFileSync(resolve(taskDir, "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir, "index.json"), JSON.stringify([1, 2]));

  const result = await next(taskDir);
  expect(result).toEqual({ task: { id: 2, title: "タスク2", status: "todo" } });
});
