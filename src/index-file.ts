import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function readIndex(taskDir: string): number[] {
  const indexPath = resolve(taskDir, "index.json");
  if (!existsSync(indexPath)) return [];
  return JSON.parse(readFileSync(indexPath, "utf-8"));
}

export function writeIndex(taskDir: string, ids: number[]): void {
  writeFileSync(resolve(taskDir, "index.json"), JSON.stringify(ids));
}
