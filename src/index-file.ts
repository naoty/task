import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export type Index = {
  order: number[];
  dependencies: Record<string, number[]>;
};

export function readIndex(taskDir: string): Index {
  const indexPath = resolve(taskDir, "index.json");
  if (!existsSync(indexPath)) return { order: [], dependencies: {} };
  return JSON.parse(readFileSync(indexPath, "utf-8"));
}

export function writeIndex(taskDir: string, index: Index): void {
  writeFileSync(resolve(taskDir, "index.json"), JSON.stringify(index));
}
