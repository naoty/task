import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { type Index, readIndex, writeIndex } from "../index-file";

function collectDescendants(id: number, index: Index): number[] {
  const children = index.children[String(id)] ?? [];
  return children.flatMap((childId) => [childId, ...collectDescendants(childId, index)]);
}

export async function deleteTask(id: number, taskDir: string): Promise<{ ids: number[] }> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`task not found: ${id}`);
  }

  const index = readIndex(taskDir);
  const toDelete = new Set<number>([id, ...collectDescendants(id, index)]);

  // タスクファイルを削除
  for (const deleteId of toDelete) {
    const file = resolve(taskDir, `${deleteId}.md`);
    if (existsSync(file)) rmSync(file);
  }

  // children を再構築: 削除されたキーと値を除去
  const newChildren: Record<string, number[]> = {};
  for (const [key, childIds] of Object.entries(index.children)) {
    if (key !== "root" && toDelete.has(Number(key))) continue;
    const filtered = childIds.filter((i) => !toDelete.has(i));
    newChildren[key] = filtered;
  }
  // 空になった非ルートエントリを削除
  for (const key of Object.keys(newChildren)) {
    if (key !== "root" && newChildren[key].length === 0) {
      delete newChildren[key];
    }
  }

  // dependencies を再構築: 削除されたキーと値を除去
  const newDependencies: Record<string, number[]> = {};
  for (const [key, depIds] of Object.entries(index.dependencies)) {
    if (toDelete.has(Number(key))) continue;
    const filtered = depIds.filter((i) => !toDelete.has(i));
    if (filtered.length > 0) {
      newDependencies[key] = filtered;
    }
  }

  writeIndex(taskDir, { children: newChildren, dependencies: newDependencies });

  return { ids: [...toDelete] };
}
