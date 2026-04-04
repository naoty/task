import { expect, test } from "bun:test";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runCli } from "../src/cli/run";
import { writeIndex } from "../src/index-file";
import { useTempTaskDir } from "./helpers";

function readIndexChildren(taskDir: string): Record<string, number[]> {
  return JSON.parse(readFileSync(resolve(taskDir, "index.json"), "utf-8"))
    .children;
}

const { taskDir } = useTempTaskDir();

test("タスクが存在しない場合、IDが1のタスクを作成する", async () => {
  const { output } = await runCli(["add", "買い物をする"], taskDir());
  expect(JSON.parse(output).result).toEqual({ id: 1 });
});

test("既存タスクのIDの最大値+1を新しいIDとする", async () => {
  await runCli(["add", "タスク1"], taskDir());
  await runCli(["add", "タスク2"], taskDir());
  const { output } = await runCli(["add", "タスク3"], taskDir());
  expect(JSON.parse(output).result).toEqual({ id: 3 });
});

test("作成されるファイルの内容がタスクファイル仕様に従う", async () => {
  await runCli(["add", "買い物をする"], taskDir());
  const content = readFileSync(resolve(taskDir(), "1.md"), "utf-8");
  expect(content).toBe("---\ntitle: 買い物をする\nstatus: todo\n---\n\n");
});

test("TASK_DIRが存在しない場合は自動的に作成する", async () => {
  const nonExistentDir = resolve(taskDir(), "nested", "tasks");
  const { output } = await runCli(["add", "タスク"], nonExistentDir);
  expect(JSON.parse(output).result).toEqual({ id: 1 });
  expect(readdirSync(nonExistentDir)).toContain("1.md");
});

test("タスク作成後にインデックスファイルの children.root に新しいIDが末尾に追加される", async () => {
  await runCli(["add", "タスク1"], taskDir());
  await runCli(["add", "タスク2"], taskDir());
  await runCli(["add", "タスク3"], taskDir());
  expect(readIndexChildren(taskDir()).root).toEqual([1, 2, 3]);
});

test("インデックスファイルが存在しない場合は新規作成される", async () => {
  await runCli(["add", "タスク"], taskDir());
  expect(readIndexChildren(taskDir()).root).toEqual([1]);
});

test("--parent を指定するとサブタスクとして children[parentId] に追加される", async () => {
  writeFileSync(
    resolve(taskDir(), "1.md"),
    "---\ntitle: 親タスク\nstatus: todo\n---\n",
  );
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1] }, dependencies: {} }),
  );

  const { output } = await runCli(
    ["add", "サブタスク", "--parent", "1"],
    taskDir(),
  );
  expect(JSON.parse(output).result).toEqual({ id: 2 });
  expect(readIndexChildren(taskDir())).toEqual({ root: [1], "1": [2] });
});

test("--parent で存在しないIDを指定するとエラーをスローする", async () => {
  const { output, exitCode } = await runCli(
    ["add", "サブタスク", "--parent", "99"],
    taskDir(),
  );
  expect(exitCode).toBe(1);
  expect(JSON.parse(output).error.message).toBe("Task 99 not found");
});

test("--parent でアーカイブ済みタスクのIDを指定するとエラーをスローする", async () => {
  mkdirSync(taskDir(), { recursive: true });
  writeFileSync(
    resolve(taskDir(), "1.md"),
    "---\ntitle: 親タスク\nstatus: done\n---\n",
  );
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [] }, dependencies: {} }),
  );

  const { output, exitCode } = await runCli(
    ["add", "サブタスク", "--parent", "1"],
    taskDir(),
  );
  expect(exitCode).toBe(1);
  expect(JSON.parse(output).error.message).toBe("Task 1 is archived");
});

test("--body を指定するとfrontmatter以下に本文が書き込まれる", async () => {
  await runCli(["add", "タスク", "--body", "本文内容"], taskDir());
  const content = readFileSync(resolve(taskDir(), "1.md"), "utf-8");
  expect(content).toBe("---\ntitle: タスク\nstatus: todo\n---\n\n本文内容");
});

test("--body を指定しない場合はfrontmatter以下が空になる", async () => {
  await runCli(["add", "タスク"], taskDir());
  const content = readFileSync(resolve(taskDir(), "1.md"), "utf-8");
  expect(content).toBe("---\ntitle: タスク\nstatus: todo\n---\n\n");
});

test("doneの親タスクにサブタスクを追加すると親タスクがdoingになる", async () => {
  writeFileSync(
    resolve(taskDir(), "1.md"),
    "---\ntitle: 親タスク\nstatus: done\n---\n",
  );
  writeIndex(taskDir(), {
    children: { root: [1] },
    dependencies: {},
  });
  await runCli(["add", "サブタスク", "--parent", "1"], taskDir());
  expect(readFileSync(resolve(taskDir(), "1.md"), "utf-8")).toContain(
    "status: doing",
  );
});

test("doneの祖父タスクにも再帰的にdoingが伝播する", async () => {
  writeFileSync(
    resolve(taskDir(), "1.md"),
    "---\ntitle: 祖父タスク\nstatus: done\n---\n",
  );
  writeFileSync(
    resolve(taskDir(), "2.md"),
    "---\ntitle: 親タスク\nstatus: done\n---\n",
  );
  writeIndex(taskDir(), {
    children: { root: [1], "1": [2] },
    dependencies: {},
  });
  await runCli(["add", "サブタスク", "--parent", "2"], taskDir());
  expect(readFileSync(resolve(taskDir(), "2.md"), "utf-8")).toContain(
    "status: doing",
  );
  expect(readFileSync(resolve(taskDir(), "1.md"), "utf-8")).toContain(
    "status: doing",
  );
});

test("doingの親タスクにサブタスクを追加してもステータスは変わらない", async () => {
  writeFileSync(
    resolve(taskDir(), "1.md"),
    "---\ntitle: 親タスク\nstatus: doing\n---\n",
  );
  writeIndex(taskDir(), {
    children: { root: [1] },
    dependencies: {},
  });
  await runCli(["add", "サブタスク", "--parent", "1"], taskDir());
  expect(readFileSync(resolve(taskDir(), "1.md"), "utf-8")).toContain(
    "status: doing",
  );
});

test("todoの親タスクにサブタスクを追加してもステータスは変わらない", async () => {
  writeFileSync(
    resolve(taskDir(), "1.md"),
    "---\ntitle: 親タスク\nstatus: todo\n---\n",
  );
  writeIndex(taskDir(), {
    children: { root: [1] },
    dependencies: {},
  });
  await runCli(["add", "サブタスク", "--parent", "1"], taskDir());
  expect(readFileSync(resolve(taskDir(), "1.md"), "utf-8")).toContain(
    "status: todo",
  );
});
