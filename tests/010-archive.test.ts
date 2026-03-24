import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { archive } from "../src/commands/archive";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("doneのタスクをインデックスから取り除く", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: {} }),
  );

  await archive(taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.order).toEqual([1]);
});

test("アーカイブしたタスクの配列を返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: {} }),
  );

  const result = await archive(taskDir());

  expect(result).toEqual({
    tasks: [{ id: 2, title: "タスク2", status: "done", path: resolve(taskDir(), "2.md") }],
  });
});

test("todo/doingのタスクはアーカイブされない", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: doing\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: {} }),
  );

  const result = await archive(taskDir());

  expect(result).toEqual({ tasks: [] });
  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.order).toEqual([1, 2]);
});

test("doneのタスクが0件のとき空の配列を返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "index.json"), JSON.stringify({ order: [1], dependencies: {} }));

  const result = await archive(taskDir());

  expect(result).toEqual({ tasks: [] });
});

test("タスクディレクトリが存在しない場合、空の配列を返す", async () => {
  const result = await archive(resolve(taskDir(), "nonexistent"));
  expect(result).toEqual({ tasks: [] });
});

test("アーカイブしたタスクへの依存関係をdependenciesから削除する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: { "1": [2] } }),
  );

  await archive(taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({});
});

test("アーカイブしたタスク以外の依存関係は残す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2, 3], dependencies: { "1": [2, 3] } }),
  );

  await archive(taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});
