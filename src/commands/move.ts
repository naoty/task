import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { readIndex, writeIndex } from "../index-file";
import { readTask } from "../task";
import type { Task } from "../task";

export async function moveTask(id: number, number: number, taskDir: string): Promise<Task> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`Task ${id} not found`);
  }

  const index = readIndex(taskDir);
  const filtered = index.filter((i) => i !== id);

  const position = Math.max(0, Math.min(number - 1, filtered.length));
  filtered.splice(position, 0, id);

  writeIndex(taskDir, filtered);

  return readTask(id, taskDir);
}
