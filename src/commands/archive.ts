import { existsSync, readdirSync } from "node:fs";
import { readIndex, writeIndex } from "../index-file";
import { extractTaskIds, readTask } from "../task";
import type { Task } from "../task";

export async function archive(taskDir: string): Promise<{ tasks: Task[] }> {
  if (!existsSync(taskDir)) {
    return { tasks: [] };
  }

  const files = readdirSync(taskDir);
  const allIds = new Set(extractTaskIds(files));

  const index = readIndex(taskDir);
  const indexedIds = index.order.filter((id) => allIds.has(id));

  const archivedTasks: Task[] = [];
  const remainingIds: number[] = [];

  for (const id of indexedIds) {
    const task = readTask(id, taskDir);
    if (task.status === "done") {
      archivedTasks.push(task);
    } else {
      remainingIds.push(id);
    }
  }

  const archivedIds = new Set(archivedTasks.map((t) => t.id));
  const dependencies = Object.fromEntries(
    Object.entries(index.dependencies)
      .map(([key, deps]) => [key, deps.filter((id) => !archivedIds.has(id))])
      .filter(([, deps]) => (deps as number[]).length > 0),
  );

  writeIndex(taskDir, { order: remainingIds, dependencies });

  return { tasks: archivedTasks };
}
