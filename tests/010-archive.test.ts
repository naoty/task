import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "bun:test";
import { runCli } from "../src/cli/run";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("doneのタスクをインデックスから取り除く", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: {} }),
  );

  await runCli(["archive"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([1]);
});

test("アーカイブしたタスクの配列を返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: {} }),
  );

  const { output } = await runCli(["archive"], taskDir());

  expect(JSON.parse(output).result).toEqual({
    tasks: [{ id: 2, title: "タスク2", status: "done", path: resolve(taskDir(), "2.md") }],
  });
});

test("todo/doingのタスクはアーカイブされない", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: doing\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: {} }),
  );

  const { output } = await runCli(["archive"], taskDir());

  expect(JSON.parse(output).result).toEqual({ tasks: [] });
  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toEqual([1, 2]);
});

test("doneのタスクが0件のとき空の配列を返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1] }, dependencies: {} }),
  );

  const { output } = await runCli(["archive"], taskDir());

  expect(JSON.parse(output).result).toEqual({ tasks: [] });
});

test("タスクディレクトリが存在しない場合、空の配列を返す", async () => {
  const { output } = await runCli(["archive"], resolve(taskDir(), "nonexistent"));
  expect(JSON.parse(output).result).toEqual({ tasks: [] });
});

test("アーカイブしたタスクへの依存関係をdependenciesから削除する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: { "1": [2] } }),
  );

  await runCli(["archive"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({});
});

test("アーカイブしたタスク以外の依存関係は残す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: done\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2, 3] }, dependencies: { "1": [2, 3] } }),
  );

  await runCli(["archive"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("doneの親タスクをアーカイブすると子タスクをルートに移動する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親タスク\nstatus: done\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 子タスク\nstatus: todo\n---\n");
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1], "1": [2] }, dependencies: {} }),
  );

  await runCli(["archive"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children.root).toContain(2);
  expect(Object.keys(index.children)).not.toContain("1");
});
