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

test("削除したタスクのIDの配列を返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: テスト\nstatus: todo\n---\n");
  const result = await deleteTask(1, taskDir());
  expect(result).toEqual({ ids: [1] });
});

test("タスクが存在しない場合はエラーをスローする", async () => {
  await expect(deleteTask(999, taskDir())).rejects.toThrow("task not found: 999");
});

test("インデックスファイルに含まれる場合は取り除く", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [2, 1] }, dependencies: {} }),
  );
  await deleteTask(1, taskDir());
  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([2]);
});

test("インデックスファイルが存在しない場合はエラーにならない", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: テスト\nstatus: todo\n---\n");
  await expect(deleteTask(1, taskDir())).resolves.toEqual({ ids: [1] });
});

test("子タスクも再帰的に削除する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 子タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: 孫タスク\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1], "1": [2], "2": [3] }, dependencies: {} }),
  );

  const result = await deleteTask(1, taskDir());

  expect(result.ids).toContain(1);
  expect(result.ids).toContain(2);
  expect(result.ids).toContain(3);
  expect(existsSync(resolve(taskDir(), "1.md"))).toBe(false);
  expect(existsSync(resolve(taskDir(), "2.md"))).toBe(false);
  expect(existsSync(resolve(taskDir(), "3.md"))).toBe(false);

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children).toEqual({ root: [] });
});

test("削除対象が他タスクから依存されている場合、dependenciesから参照を取り除く", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: { "2": [1] } }),
  );

  await deleteTask(1, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({});
});

test("削除対象が他タスクを依存している場合、dependenciesからエントリを削除する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2, 3] }, dependencies: { "1": [2, 3] } }),
  );

  await deleteTask(1, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({});
});

test("子タスクを持つ親タスクを削除すると children からキーも削除される", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 子タスク\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1], "1": [2] }, dependencies: {} }),
  );

  await deleteTask(1, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(Object.keys(index.children)).not.toContain("1");
});
