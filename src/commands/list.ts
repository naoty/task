import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseFrontmatter } from "../frontmatter";
import type { Task } from "../task";

export async function list(taskDir: string): Promise<{ tasks: Task[] }> {
  if (!existsSync(taskDir)) {
    return { tasks: [] };
  }

  const files = readdirSync(taskDir);
  const tasks: Task[] = files
    .map((f) => f.match(/^(\d+)\.md$/))
    .filter((m) => m !== null)
    .map((m) => {
      const id = parseInt(m[1], 10);
      const content = readFileSync(resolve(taskDir, `${id}.md`), "utf-8");
      const fields = parseFrontmatter(content);
      return { id, title: fields.title ?? "", status: fields.status ?? "todo" };
    });

  const indexPath = resolve(taskDir, "index.json");
  const index: number[] = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf-8")) : [];

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
