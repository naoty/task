import { existsSync, readdirSync } from "node:fs";
import { readIndex } from "../index-file";
import { extractTaskIds, readTask } from "../task";
import type { Task } from "../task";

export async function list(taskDir: string): Promise<{ tasks: Task[] }> {
  if (!existsSync(taskDir)) {
    return { tasks: [] };
  }

  const files = readdirSync(taskDir);
  const allIds = new Set(extractTaskIds(files));

  const index = readIndex(taskDir);
  const indexedIds = index.filter((id) => allIds.has(id));
  const indexedTasks: Task[] = indexedIds.map((id) => readTask(id, taskDir));

  const indexedIdSet = new Set(indexedIds);
  const remainingIds = [...allIds].filter((id) => !indexedIdSet.has(id)).sort((a, b) => a - b);
  const remainingTasks: Task[] = remainingIds.map((id) => readTask(id, taskDir));

  return { tasks: [...indexedTasks, ...remainingTasks] };
}
