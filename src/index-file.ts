import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export type Index = {
  children: Record<string, number[]>;
  dependencies: Record<string, number[]>;
};

export function readIndex(taskDir: string): Index {
  const indexPath = resolve(taskDir, "index.json");
  if (!existsSync(indexPath)) return { children: { root: [] }, dependencies: {} };
  return JSON.parse(readFileSync(indexPath, "utf-8"));
}

export function writeIndex(taskDir: string, index: Index): void {
  writeFileSync(resolve(taskDir, "index.json"), JSON.stringify(index));
}

/** index の children から id を含むキーを返す。見つからない場合は null */
export function getParentKey(index: Index, id: number): string | null {
  for (const [key, ids] of Object.entries(index.children)) {
    if (ids.includes(id)) return key;
  }
  return null;
}

/** ancestorId の子孫に descendantId が含まれるかを検査する（循環参照チェック用） */
export function isDescendant(index: Index, ancestorId: number, descendantId: number): boolean {
  const children = index.children[String(ancestorId)] ?? [];
  return children.some(
    (childId) => childId === descendantId || isDescendant(index, childId, descendantId),
  );
}
