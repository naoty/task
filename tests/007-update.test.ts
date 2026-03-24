import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { updateTask } from "../src/commands/update";
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

test("statusのバリデーションに失敗した場合はエラーをスローする", async () => {
  writeFileSync(resolve(taskDir(), "1.md"), "---\ntitle: 買い物をする\nstatus: todo\n---\n");
  await expect(updateTask(1, { status: "invalid" }, taskDir())).rejects.toThrow(
    "invalid status: invalid",
  );
});
