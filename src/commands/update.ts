import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseFrontmatter, serializeFrontmatter } from "../frontmatter";
import { readTask } from "../task";
import type { Task } from "../task";

const VALID_STATUSES = ["todo", "doing", "done"];

export async function updateTask(
  id: number,
  updates: Record<string, string>,
  taskDir: string,
): Promise<Task> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`task not found: ${id}`);
  }

  for (const [field, value] of Object.entries(updates)) {
    if (field === "status" && !VALID_STATUSES.includes(value)) {
      throw new Error(`invalid status: ${value}`);
    }
  }

  const content = readFileSync(taskFile, "utf-8");
  const fields = parseFrontmatter(content);

  const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : "";

  for (const [key, value] of Object.entries(updates)) {
    fields[key] = value;
  }

  writeFileSync(taskFile, serializeFrontmatter(fields, body));

  return readTask(id, taskDir);
}
