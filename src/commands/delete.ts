import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export async function deleteTask(id: number, taskDir: string): Promise<{ id: number }> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`task not found: ${id}`);
  }

  rmSync(taskFile);

  const indexFile = resolve(taskDir, "index.json");
  if (existsSync(indexFile)) {
    const index: number[] = JSON.parse(readFileSync(indexFile, "utf-8"));
    const updated = index.filter((i) => i !== id);
    writeFileSync(indexFile, JSON.stringify(updated));
  }

  return { id };
}
