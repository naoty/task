import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { runCli } from "../src/cli/run";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("依存関係を追加する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: {} }),
  );

  await runCli(["dep", "add", "1", "2"], taskDir());

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

  await runCli(["dep", "add", "1", "2", "3", "4"], taskDir());

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

  await runCli(["dep", "add", "1", "2"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("インデックスファイルが存在しない場合でも依存関係を追加する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");

  await runCli(["dep", "add", "1", "2"], taskDir());

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

  await runCli(["dep", "add", "1", "2"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children).toEqual({ root: [3, 1, 2] });
});

test("id が存在しないタスクの場合、エラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [2] }, dependencies: {} }),
  );

  const { output, exitCode } = await runCli(["dep", "add", "999", "2"], taskDir());
  expect(exitCode).toBe(1);
  expect(JSON.parse(output).error.message).toBe("task not found: 999");
});

test("自己依存を追加しようとした場合、エラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1] }, dependencies: {} }),
  );

  const { output, exitCode } = await runCli(["dep", "add", "1", "1"], taskDir());
  expect(exitCode).toBe(1);
  expect(JSON.parse(output).error.message).toBe("Circular dependency detected");
});

test("dependency-id が存在しないタスクの場合、エラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1] }, dependencies: {} }),
  );

  const { output, exitCode } = await runCli(["dep", "add", "1", "999"], taskDir());
  expect(exitCode).toBe(1);
  expect(JSON.parse(output).error.message).toBe("task not found: 999");
});
