import { readIndex, writeIndex } from "../index-file";

export async function depDelete(id: number, depIds: number[], taskDir: string): Promise<object> {
  const index = readIndex(taskDir);
  const key = String(id);
  const toRemove = new Set(depIds);
  const remaining = (index.dependencies[key] ?? []).filter((d) => !toRemove.has(d));
  if (remaining.length === 0) {
    delete index.dependencies[key];
  } else {
    index.dependencies[key] = remaining;
  }
  writeIndex(taskDir, index);
  return {};
}
