import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseFrontmatter } from "../frontmatter";
import { readIndex } from "../index-file";
import { extractTaskIds } from "../task";
import type { Task } from "../task";

export async function list(taskDir: string): Promise<{ tasks: Task[] }> {
  if (!existsSync(taskDir)) {
    return { tasks: [] };
  }

  const files = readdirSync(taskDir);
  const tasks: Task[] = extractTaskIds(files).map((id) => {
    const content = readFileSync(resolve(taskDir, `${id}.md`), "utf-8");
    const fields = parseFrontmatter(content);
    return { id, title: fields.title ?? "", status: fields.status ?? "todo" };
  });

  const index = readIndex(taskDir);

  tasks.sort((a, b) => {
    const ai = index.indexOf(a.id);
    const bi = index.indexOf(b.id);
    if (ai === -1 && bi === -1) return a.id - b.id;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return { tasks };
}
