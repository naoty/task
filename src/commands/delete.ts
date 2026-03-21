import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { readIndex, writeIndex } from "../index-file";

export async function deleteTask(id: number, taskDir: string): Promise<{ id: number }> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`task not found: ${id}`);
  }

  rmSync(taskFile);

  writeIndex(
    taskDir,
    readIndex(taskDir).filter((i) => i !== id),
  );

  return { id };
}
