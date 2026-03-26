import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { updateTask } from "../src/commands/update";
import { writeIndex } from "../src/index-file";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("指定したフィールドを更新して保存する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 買い物をする\nstatus: todo\n---\n");
  await updateTask(1, { status: "done" }, taskDir());
  const content = readFileSync(resolve(taskDir(), "1.md"), "utf-8");
  expect(content).toContain("status: done");
});

test("更新後のタスクを返す", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 買い物をする\nstatus: todo\n---\n");
  const result = await updateTask(1, { status: "done" }, taskDir());
  expect(result).toEqual({
    id: 1,
    title: "買い物をする",
    status: "done",
    path: resolve(taskDir(), "1.md"),
  });
});

test("複数のフィールドを同時に更新できる", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 買い物をする\nstatus: todo\n---\n");
  const result = await updateTask(1, { title: "買い物と掃除をする", status: "doing" }, taskDir());
  expect(result).toEqual({
    id: 1,
    title: "買い物と掃除をする",
    status: "doing",
    path: resolve(taskDir(), "1.md"),
  });
});

test("未知のフィールドをそのまま保存する", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 買い物をする\nstatus: todo\n---\n");
  const result = await updateTask(1, { deadline: "2026-03-31" }, taskDir());
  expect(result).toEqual({
    id: 1,
    title: "買い物をする",
    status: "todo",
    deadline: "2026-03-31",
    path: resolve(taskDir(), "1.md"),
  });
});

test("タスクが存在しない場合はエラーをスローする", async () => {
  await expect(updateTask(999, { status: "done" }, taskDir())).rejects.toThrow(
    "task not found: 999",
  );
});

test("parentフィールドを指定した場合はエラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 買い物をする\nstatus: todo\n---\n");
  await expect(updateTask(1, { parent: "2" }, taskDir())).rejects.toThrow(
    'cannot update "parent": use "task move --parent <id>"',
  );
});

test("dependenciesフィールドを指定した場合はエラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 買い物をする\nstatus: todo\n---\n");
  await expect(updateTask(1, { dependencies: "2" }, taskDir())).rejects.toThrow(
    'cannot update "dependencies": use "task dep add" or "task dep delete"',
  );
});

test("statusのバリデーションに失敗した場合はエラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 買い物をする\nstatus: todo\n---\n");
  await expect(updateTask(1, { status: "invalid" }, taskDir())).rejects.toThrow(
    "invalid status: invalid",
  );
});

test("statusをdoneにすると子タスクも再帰的にdoneになる", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 子タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: 子タスク2\nstatus: doing\n---\n");
  writeIndex(taskDir(), {
    children: { root: [1], "1": [2, 3] },
    dependencies: {},
  });
  await updateTask(1, { status: "done" }, taskDir());
  expect(readFileSync(resolve(taskDir(), "2.md"), "utf-8")).toContain("status: done");
  expect(readFileSync(resolve(taskDir(), "3.md"), "utf-8")).toContain("status: done");
});

test("statusをdoneにすると孫タスクも再帰的にdoneになる", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 親タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "2.md"), "---\ntitle: 子タスク\nstatus: todo\n---\n");
  writeFileSync(resolve(taskDir(), "3.md"), "---\ntitle: 孫タスク\nstatus: todo\n---\n");
  writeIndex(taskDir(), {
    children: { root: [1], "1": [2], "2": [3] },
    dependencies: {},
  });
  await updateTask(1, { status: "done" }, taskDir());
  expect(readFileSync(resolve(taskDir(), "2.md"), "utf-8")).toContain("status: done");
  expect(readFileSync(resolve(taskDir(), "3.md"), "utf-8")).toContain("status: done");
});
