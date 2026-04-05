import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseFrontmatter } from "./frontmatter";

export type Status = "todo" | "doing" | "done";

export const STATUSES: Status[] = ["todo", "doing", "done"];

export type Task = {
  id: number;
  path: string;
  title: string;
  status: Status;
  [key: string]: string | number;
};

export function extractTaskIds(files: string[]): number[] {
  return files
    .map((f) => f.match(/^(\d+)\.md$/))
    .filter((m) => m !== null)
    .map((m) => parseInt(m[1], 10));
}

export function readTask(id: number, taskDir: string): Task {
  const filePath = resolve(taskDir, `${id}.md`);
  const content = readFileSync(filePath, "utf-8");
  const fields = parseFrontmatter(content);
  return { id, path: filePath, ...fields } as Task;
}
