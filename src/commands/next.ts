import { existsSync, readdirSync } from "node:fs";
import { readIndex } from "../index-file";
import { extractTaskIds, readTask } from "../task";
import type { Task } from "../task";

export async function next(taskDir: string): Promise<{ task: Task | null }> {
  if (!existsSync(taskDir)) {
    return { task: null };
  }

  const files = readdirSync(taskDir);
  const allIds = new Set(extractTaskIds(files));
  const index = readIndex(taskDir);
  const taskCache = new Map<number, Task>();

  function getTask(id: number): Task {
    if (!taskCache.has(id)) taskCache.set(id, readTask(id, taskDir));
    return taskCache.get(id)!;
  }

  // 深さ優先: 子タスクを先に評価し、その後親タスクを評価する
  function findNext(parentKey: string): Task | null {
    const ids = (index.children[parentKey] ?? []).filter((id) => allIds.has(id));
    for (const id of ids) {
      const fromChildren = findNext(String(id));
      if (fromChildren) return fromChildren;

      const task = getTask(id);
      if (task.status !== "todo") continue;

      const deps = index.dependencies[String(id)] ?? [];
      const allDepsDone = deps.every((depId) => {
        if (!allIds.has(depId)) return true; // アーカイブ済み = 完了とみなす
        return getTask(depId).status === "done";
      });

      if (allDepsDone) return task;
    }
    return null;
  }

  return { task: findNext("root") };
}
