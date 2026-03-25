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

  // children の全値からインデックス済みIDを収集
  const allIndexedIds = new Set<number>();
  for (const ids of Object.values(index.children)) {
    for (const id of ids) {
      if (allIds.has(id)) allIndexedIds.add(id);
    }
  }

  const archivedTasks: Task[] = [];
  const archivedIds = new Set<number>();

  for (const id of allIndexedIds) {
    const task = readTask(id, taskDir);
    if (task.status === "done") {
      archivedTasks.push(task);
      archivedIds.add(id);
    }
  }

  if (archivedIds.size === 0) return { tasks: [] };

  // children を再構築: アーカイブされた親の子をルートに昇格
  const promotedToRoot: number[] = [];
  const newChildren: Record<string, number[]> = {};

  for (const [key, ids] of Object.entries(index.children)) {
    if (key !== "root" && archivedIds.has(Number(key))) {
      // アーカイブされた親タスクの子をルートに昇格
      const orphans = ids.filter((id) => !archivedIds.has(id));
      promotedToRoot.push(...orphans);
      continue;
    }
    newChildren[key] = ids.filter((id) => !archivedIds.has(id));
  }

  newChildren["root"] = [...(newChildren["root"] ?? []), ...promotedToRoot];

  // 空になった非ルートエントリを削除
  for (const key of Object.keys(newChildren)) {
    if (key !== "root" && newChildren[key].length === 0) {
      delete newChildren[key];
    }
  }

  const dependencies = Object.fromEntries(
    Object.entries(index.dependencies)
      .map(([key, deps]) => [key, deps.filter((id) => !archivedIds.has(id))])
      .filter(([, deps]) => (deps as number[]).length > 0),
  );

  writeIndex(taskDir, { children: newChildren, dependencies });

  return { tasks: archivedTasks };
}
