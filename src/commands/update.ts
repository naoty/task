import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const VALID_STATUSES = ["todo", "doing", "done"];

type Task = Record<string, string | number>;

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) {
      fields[m[1]] = m[2];
    }
  }
  return fields;
}

function serializeFrontmatter(fields: Record<string, string>, body: string): string {
  const fm = Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${fm}\n---\n${body}`;
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

  const task: Task = { id };
  for (const [key, value] of Object.entries(fields)) {
    task[key] = value;
  }
  return task;
}
