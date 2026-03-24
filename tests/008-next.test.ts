import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { next } from "../src/commands/next";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("todo のタスクがない場合、task を null で返す", async () => {
  const result = await next(taskDir());
  expect(result).toEqual({ task: null });
});

test("todo のタスクが1件ある場合、そのタスクを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "index.json"), JSON.stringify({ order: [1], dependencies: {} }));

  const result = await next(taskDir());
  expect(result).toEqual({
    task: { id: 1, title: "タスク1", status: "todo", path: resolve(taskDir(), "1.md") },
  });
});

test("done のタスクのみの場合、task を null で返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: done\n---\n");

  const result = await next(taskDir());
  expect(result).toEqual({ task: null });
});

test("インデックスの優先順位順で最初の todo タスクを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [3, 1, 2], dependencies: {} }),
  );

  const result = await next(taskDir());
  expect(result).toEqual({
    task: { id: 3, title: "タスク3", status: "todo", path: resolve(taskDir(), "3.md") },
  });
});

test("frontmatterのすべてのフィールドを返す", async () => {
  writeFileSync(
    resolve(taskDir(), "1.md"),
    "---\ntitle: タスク1\nstatus: todo\ndeadline: 2026-03-31\n---\n",
  );
  writeFileSync(resolve(taskDir(), "index.json"), JSON.stringify({ order: [1], dependencies: {} }));

  const result = await next(taskDir());
  expect(result).toEqual({
    task: {
      id: 1,
      title: "タスク1",
      status: "todo",
      deadline: "2026-03-31",
      path: resolve(taskDir(), "1.md"),
    },
  });
});

test("todo より前の done タスクをスキップして最初の todo タスクを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: done\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: {} }),
  );

  const result = await next(taskDir());
  expect(result).toEqual({
    task: { id: 2, title: "タスク2", status: "todo", path: resolve(taskDir(), "2.md") },
  });
});

test("依存タスクが todo の場合、そのタスクをスキップして依存タスクを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: { "1": [2] } }),
  );

  const result = await next(taskDir());
  expect(result).toEqual({
    task: { id: 2, title: "タスク2", status: "todo", path: resolve(taskDir(), "2.md") },
  });
});

test("依存タスクが done の場合、そのタスクを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: { "1": [2] } }),
  );

  const result = await next(taskDir());
  expect(result).toEqual({
    task: { id: 1, title: "タスク1", status: "todo", path: resolve(taskDir(), "1.md") },
  });
});

test("依存タスクがアクティブなインデックスにない場合（アーカイブ済み）、そのタスクを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1], dependencies: { "1": [99] } }),
  );

  const result = await next(taskDir());
  expect(result).toEqual({
    task: { id: 1, title: "タスク1", status: "todo", path: resolve(taskDir(), "1.md") },
  });
});

test("すべての todo タスクが未完了の依存関係を持つ場合、null を返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: { "1": [2], "2": [1] } }),
  );

  const result = await next(taskDir());
  expect(result).toEqual({ task: null });
});
