import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { list } from "../src/commands/list";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("タスクが存在しない場合、空の配列を返す", async () => {
  const result = await list(taskDir());
  expect(result).toEqual({ tasks: [] });
});

test("タスクディレクトリが存在しない場合、空の配列を返す", async () => {
  const result = await list(resolve(taskDir(), "nonexistent"));
  expect(result).toEqual({ tasks: [] });
});

test("タスクをインデックスの優先順位順で返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: doing\n---\n");
  writeFileSync(resolve(taskDir(), "index.json"), JSON.stringify([3, 1, 2]));

  const result = await list(taskDir());
  expect(result).toEqual({
    tasks: [
      { id: 3, title: "タスク3", status: "doing" },
      { id: 1, title: "タスク1", status: "todo" },
      { id: 2, title: "タスク2", status: "done" },
    ],
  });
});

test("インデックスファイルが存在しない場合、ID順でタスクを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");

  const result = await list(taskDir());
  expect(result).toEqual({
    tasks: [
      { id: 1, title: "タスク1", status: "todo" },
      { id: 2, title: "タスク2", status: "done" },
    ],
  });
});

test("インデックスにないタスクはインデックスにあるタスクの後に返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: タスク1\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: タスク2\nstatus: done\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: タスク3\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "index.json"), JSON.stringify([2]));

  const result = await list(taskDir());
  expect(result).toEqual({
    tasks: [
      { id: 2, title: "タスク2", status: "done" },
      { id: 1, title: "タスク1", status: "todo" },
      { id: 3, title: "タスク3", status: "todo" },
    ],
  });
});
