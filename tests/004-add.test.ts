import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { add } from "../src/commands/add.ts";

function readIndex(taskDir: string): number[] {
  return JSON.parse(readFileSync(resolve(taskDir, "index.json"), "utf-8"));
}

let taskDir: string;

beforeEach(() => {
  taskDir = mkdtempSync(resolve(tmpdir(), "task-test-"));
});

afterEach(() => {
  rmSync(taskDir, { recursive: true, force: true });
});

test("タスクが存在しない場合、IDが1のタスクを作成する", async () => {
  const result = await add("買い物をする", taskDir);
  expect(result).toEqual({ id: 1 });
});

test("既存タスクのIDの最大値+1を新しいIDとする", async () => {
  await add("タスク1", taskDir);
  await add("タスク2", taskDir);
  const result = await add("タスク3", taskDir);
  expect(result).toEqual({ id: 3 });
});

test("作成されるファイルの内容がタスクファイル仕様に従う", async () => {
  await add("買い物をする", taskDir);
  const content = readFileSync(resolve(taskDir, "1.md"), "utf-8");
  expect(content).toBe("---\ntitle: 買い物をする\nstatus: todo\n---\n");
});

test("TASK_DIRが存在しない場合は自動的に作成する", async () => {
  const nonExistentDir = resolve(taskDir, "nested", "tasks");
  const result = await add("タスク", nonExistentDir);
  expect(result).toEqual({ id: 1 });
  expect(readdirSync(nonExistentDir)).toContain("1.md");
});

test("タスク作成後にインデックスファイルに新しいIDが末尾に追加される", async () => {
  await add("タスク1", taskDir);
  await add("タスク2", taskDir);
  await add("タスク3", taskDir);
  expect(readIndex(taskDir)).toEqual([1, 2, 3]);
});

test("インデックスファイルが存在しない場合は新規作成される", async () => {
  await add("タスク", taskDir);
  expect(readIndex(taskDir)).toEqual([1]);
});
