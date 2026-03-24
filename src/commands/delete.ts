import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { readIndex, writeIndex } from "../index-file";

export async function deleteTask(id: number, taskDir: string): Promise<{ id: number }> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`task not found: ${id}`);
  }

  rmSync(taskFile);

  const index = readIndex(taskDir);
  writeIndex(taskDir, { ...index, order: index.order.filter((i) => i !== id) });

  return { id };
}
