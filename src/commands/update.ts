import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseFrontmatter, serializeFrontmatter } from "../frontmatter";
import { readIndex } from "../index-file";
import type { Index } from "../index-file";
import { readTask } from "../task";
import type { Task } from "../task";

const VALID_STATUSES = ["todo", "doing", "done"];

const FORBIDDEN_FIELDS: Record<string, string> = {
  parent: 'cannot update "parent": use "task move --parent <id>"',
  dependencies: 'cannot update "dependencies": use "task dep add" or "task dep delete"',
};

function cascadeDone(id: number, index: Index, taskDir: string): void {
  const childIds = index.children[String(id)] ?? [];
  for (const childId of childIds) {
    cascadeDone(childId, index, taskDir);
    const childFile = resolve(taskDir, `${childId}.md`);
    if (existsSync(childFile)) {
      const content = readFileSync(childFile, "utf-8");
      const fields = parseFrontmatter(content);
      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const body = bodyMatch ? bodyMatch[1] : "";
      fields["status"] = "done";
      writeFileSync(childFile, serializeFrontmatter(fields, body));
    }
  }
}

export async function updateTask(
  id: number,
  updates: Record<string, string>,
  taskDir: string,
): Promise<Task> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`task not found: ${id}`);
  }

  for (const field of Object.keys(updates)) {
    if (field in FORBIDDEN_FIELDS) {
      throw new Error(FORBIDDEN_FIELDS[field]);
    }
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

  if (updates["status"] === "done") {
    const index = readIndex(taskDir);
    cascadeDone(id, index, taskDir);
  }

  return readTask(id, taskDir);
}
