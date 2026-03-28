import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { readIndex, writeIndex } from "../index-file";

export async function depAdd(
  id: number,
  depIds: number[],
  taskDir: string,
): Promise<object> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`task not found: ${id}`);
  }

  for (const depId of depIds) {
    const depFile = resolve(taskDir, `${depId}.md`);
    if (!existsSync(depFile)) {
      throw new Error(`task not found: ${depId}`);
    }
  }

  if (depIds.includes(id)) {
    throw new Error("Circular dependency detected");
  }

  const index = readIndex(taskDir);
  const key = String(id);
  const existing = new Set(index.dependencies[key] ?? []);
  for (const depId of depIds) {
    existing.add(depId);
  }
  index.dependencies[key] = Array.from(existing);
  writeIndex(taskDir, index);
  return {};
}
