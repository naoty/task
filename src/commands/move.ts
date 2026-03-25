import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getParentKey, isDescendant, readIndex, writeIndex } from "../index-file";
import { readTask } from "../task";
import type { Task } from "../task";

type MoveOptions = {
  number?: number;
  parentId?: number;
};

export async function moveTask(id: number, options: MoveOptions, taskDir: string): Promise<Task> {
  const taskFile = resolve(taskDir, `${id}.md`);
  if (!existsSync(taskFile)) {
    throw new Error(`Task ${id} not found`);
  }

  const index = readIndex(taskDir);

  if (options.parentId !== undefined) {
    const parentFile = resolve(taskDir, `${options.parentId}.md`);
    if (!existsSync(parentFile)) {
      throw new Error(`Task ${options.parentId} not found`);
    }
    if (isDescendant(index, id, options.parentId)) {
      throw new Error("Circular parent-child relationship detected");
    }
  }

  // 現在の兄弟リストから取り除く
  const currentParentKey = getParentKey(index, id);
  const newChildren = { ...index.children };
  if (currentParentKey !== null) {
    newChildren[currentParentKey] = newChildren[currentParentKey].filter((i) => i !== id);
    if (currentParentKey !== "root" && newChildren[currentParentKey].length === 0) {
      delete newChildren[currentParentKey];
    }
  }

  // 挿入先のリストと位置を決定
  let targetKey: string;
  if (options.parentId === undefined && options.number === undefined) {
    // 引数なし: ルートに移動
    targetKey = "root";
  } else if (options.parentId !== undefined) {
    targetKey = String(options.parentId);
  } else {
    // number のみ: 現在の兄弟グループ内で移動
    targetKey = currentParentKey ?? "root";
  }

  const targetList = [...(newChildren[targetKey] ?? [])];
  const position =
    options.number !== undefined
      ? Math.max(0, Math.min(options.number - 1, targetList.length))
      : targetList.length;

  targetList.splice(position, 0, id);
  newChildren[targetKey] = targetList;

  writeIndex(taskDir, { ...index, children: newChildren });
  return readTask(id, taskDir);
}
