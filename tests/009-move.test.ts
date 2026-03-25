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
    JSON.stringify({ children: { root: [3, 1, 2] }, dependencies: {} }),
  );

  await moveTask(2, { number: 1 }, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([2, 3, 1]);
});

test("移動したタスクの情報を返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1] }, dependencies: {} }),
  );

  const result = await moveTask(1, { number: 1 }, taskDir());
  expect(result).toEqual({
    id: 1,
    title: "タスク1",
    status: "todo",
    path: resolve(taskDir(), "1.md"),
  });
});

test("タスクが存在しない場合はエラーをスローする", async () => {
  await expect(moveTask(999, { number: 1 }, taskDir())).rejects.toThrow("Task 999 not found");
});

test("numberが1未満の場合は先頭に移動する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2, 3] }, dependencies: {} }),
  );

  await moveTask(3, { number: 0 }, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([3, 1, 2]);
});

test("numberがインデックスの長さを超える場合は末尾に移動する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2, 3] }, dependencies: {} }),
  );

  await moveTask(1, { number: 999 }, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([2, 3, 1]);
});

test("インデックスにないタスクを指定位置に追加する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [2] }, dependencies: {} }),
  );

  await moveTask(1, { number: 1 }, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([1, 2]);
});

test("引数なしでルートに移動する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 子タスク\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1], "1": [2] }, dependencies: {} }),
  );

  await moveTask(2, {}, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([1, 2]);
  expect(index.children["1"]).toBeUndefined();
});

test("--parent で親タスクを変更する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親A\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 親B\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: 子タスク\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2], "1": [3] }, dependencies: {} }),
  );

  await moveTask(3, { parentId: 2 }, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children["1"]).toBeUndefined();
  expect(index.children["2"]).toEqual([3]);
});

test("--parent と number で親変更と位置を同時に指定する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 子A\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: 子B\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "4.md"), "---\ntitle: ルートタスク\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 4], "1": [2, 3] }, dependencies: {} }),
  );

  await moveTask(4, { number: 1, parentId: 1 }, taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([1]);
  expect(index.children["1"]).toEqual([4, 2, 3]);
});

test("--parent で存在しないIDを指定するとエラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");

  await expect(moveTask(1, { parentId: 99 }, taskDir())).rejects.toThrow("Task 99 not found");
});

test("循環参照になる場合はエラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 子タスク\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1], "1": [2] }, dependencies: {} }),
  );

  await expect(moveTask(1, { parentId: 2 }, taskDir())).rejects.toThrow(
    "Circular parent-child relationship detected",
  );
});
