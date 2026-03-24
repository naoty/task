import { readIndex } from "../index-file";
import type { Task } from "../task";
import { list } from "./list";

export async function next(taskDir: string): Promise<{ task: Task | null }> {
  const { tasks } = await list(taskDir);
  const { dependencies } = readIndex(taskDir);

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const task =
    tasks.find((t) => {
      if (t.status !== "todo") return false;
      const deps = dependencies[String(t.id)] ?? [];
      return deps.every((depId) => {
        const depTask = taskMap.get(depId);
        // アクティブなインデックスにない依存タスクはアーカイブ済み（完了）とみなす
        return !depTask || depTask.status === "done";
      });
    }) ?? null;

  return { task };
}
