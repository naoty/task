import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { deleteTask } from "../src/commands/delete";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("指定したIDのタスクファイルを削除する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: テスト\nstatus: todo\n---\n");
  await deleteTask(1, taskDir());
  expect(existsSync(resolve(taskDir(), "1.md"))).toBe(false);
});

test("削除したタスクのIDを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: テスト\nstatus: todo\n---\n");
  const result = await deleteTask(1, taskDir());
  expect(result).toEqual({ id: 1 });
});

test("タスクが存在しない場合はエラーをスローする", async () => {
  await expect(deleteTask(999, taskDir())).rejects.toThrow("task not found: 999");
});

test("インデックスファイルに含まれる場合は取り除く", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [2, 1], dependencies: {} }),
  );
  await deleteTask(1, taskDir());
  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.order).toEqual([2]);
});

test("インデックスファイルが存在しない場合はエラーにならない", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: テスト\nstatus: todo\n---\n");
  await expect(deleteTask(1, taskDir())).resolves.toEqual({ id: 1 });
});
