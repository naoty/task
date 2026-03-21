import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { deleteTask } from "../src/commands/delete.ts";

let taskDir: string;

beforeEach(() => {
  taskDir = mkdtempSync(resolve(tmpdir(), "task-test-"));
});

afterEach(() => {
  rmSync(taskDir, { recursive: true, force: true });
});

test("指定したIDのタスクファイルを削除する", async () => {
  writeFileSync(resolve(taskDir, "1.md"), "---\ntitle: テスト\nstatus: todo\n---\n");
  await deleteTask(1, taskDir);
  expect(existsSync(resolve(taskDir, "1.md"))).toBe(false);
});

test("削除したタスクのIDを返す", async () => {
  writeFileSync(resolve(taskDir, "1.md"), "---\ntitle: テスト\nstatus: todo\n---\n");
  const result = await deleteTask(1, taskDir);
  expect(result).toEqual({ id: 1 });
});

test("タスクが存在しない場合はエラーをスローする", async () => {
  await expect(deleteTask(999, taskDir)).rejects.toThrow("task not found: 999");
});

test("インデックスファイルに含まれる場合は取り除く", async () => {
  writeFileSync(resolve(taskDir, "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir, "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir, "index.json"), JSON.stringify([2, 1]));
  await deleteTask(1, taskDir);
  const index = JSON.parse(readFileSync(resolve(taskDir, "index.json"), "utf-8"));
  expect(index).toEqual([2]);
});

test("インデックスファイルが存在しない場合はエラーにならない", async () => {
  writeFileSync(resolve(taskDir, "1.md"), "---\ntitle: テスト\nstatus: todo\n---\n");
  await expect(deleteTask(1, taskDir)).resolves.toEqual({ id: 1 });
});
