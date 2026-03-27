import { existsSync, readdirSync } from "node:fs";
import { readIndex } from "../index-file";
import type { Task } from "../task";
import { extractTaskIds, readTask } from "../task";

type TaskWithChildren = Task & { children: TaskWithChildren[] };

export async function list(
  taskDir: string,
): Promise<{ tasks: TaskWithChildren[] }> {
  if (!existsSync(taskDir)) {
    return { tasks: [] };
  }

  const files = readdirSync(taskDir);
  const allIds = new Set(extractTaskIds(files));
  const index = readIndex(taskDir);

  function buildTree(parentKey: string): TaskWithChildren[] {
    const ids = (index.children[parentKey] ?? []).filter((id) =>
      allIds.has(id),
    );
    return ids.map((id) => ({
      ...readTask(id, taskDir),
      children: buildTree(String(id)),
    })) as TaskWithChildren[];
  }

  return { tasks: buildTree("root") };
}
