import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { moveTask } from "../src/commands/move";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("指定した位置にタスクを移動する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [3, 1, 2], dependencies: {} }),
  );

  await moveTask(2, 1, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.order).toEqual([2, 3, 1]);
});

test("移動したタスクの情報を返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "index.json"), JSON.stringify({ order: [1], dependencies: {} }));

  const result = await moveTask(1, 1, taskDir());
  expect(result).toEqual({
    id: 1,
    title: "タスク1",
    status: "todo",
    path: resolve(taskDir(), "1.md"),
  });
});

test("タスクが存在しない場合はエラーをスローする", async () => {
  await expect(moveTask(999, 1, taskDir())).rejects.toThrow("Task 999 not found");
});

test("numberが1未満の場合は先頭に移動する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2, 3], dependencies: {} }),
  );

  await moveTask(3, 0, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.order).toEqual([3, 1, 2]);
});

test("numberがインデックスの長さを超える場合は末尾に移動する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2, 3], dependencies: {} }),
  );

  await moveTask(1, 999, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.order).toEqual([2, 3, 1]);
});

test("インデックスにないタスクを指定位置に追加する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "index.json"), JSON.stringify({ order: [2], dependencies: {} }));

  await moveTask(1, 1, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.order).toEqual([1, 2]);
});
