import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { depAdd } from "../src/commands/dep-add";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("依存関係を追加する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: {} }),
  );

  await depAdd(1, [2], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("複数の依存関係を一度に追加する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "4.md"), "---\ntitle: タスク4\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2, 3, 4] }, dependencies: {} }),
  );

  await depAdd(1, [2, 3, 4], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2, 3, 4] });
});

test("すでに存在する依存関係は重複して追加しない", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: { "1": [2] } }),
  );

  await depAdd(1, [2], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("インデックスファイルが存在しない場合でも依存関係を追加する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");

  await depAdd(1, [2], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("childrenフィールドを変更しない", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [3, 1, 2] }, dependencies: {} }),
  );

  await depAdd(1, [2], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children).toEqual({ root: [3, 1, 2] });
});

test("id が存在しないタスクの場合、エラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [2] }, dependencies: {} }),
  );

  await expect(depAdd(999, [2], taskDir())).rejects.toThrow("task not found: 999");
});

test("dependency-id が存在しないタスクの場合、エラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1] }, dependencies: {} }),
  );

  await expect(depAdd(1, [999], taskDir())).rejects.toThrow("task not found: 999");
});
