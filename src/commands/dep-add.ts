import { readIndex, writeIndex } from "../index-file";

export async function depAdd(id: number, depIds: number[], taskDir: string): Promise<object> {
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
