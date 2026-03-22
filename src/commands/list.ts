import { existsSync, readdirSync } from "node:fs";
import { readIndex } from "../index-file";
import { extractTaskIds, readTask } from "../task";
import type { Task } from "../task";

export async function list(taskDir: string): Promise<{ tasks: Task[] }> {
  if (!existsSync(taskDir)) {
    return { tasks: [] };
  }

  const index = readIndex(taskDir);
  const indexedTasks: Task[] = index.map((id) => readTask(id, taskDir));

  const files = readdirSync(taskDir);
  const allIds = extractTaskIds(files);
  const indexedIds = new Set(index);
  const remainingIds = allIds.filter((id) => !indexedIds.has(id)).sort((a, b) => a - b);
  const remainingTasks: Task[] = remainingIds.map((id) => readTask(id, taskDir));

  return { tasks: [...indexedTasks, ...remainingTasks] };
}
