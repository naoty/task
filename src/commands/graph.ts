import { existsSync, readdirSync } from "node:fs";
import { readIndex } from "../index-file";
import { extractTaskIds, readTask } from "../task";

export type GraphNode = { id: string; title: string; status: string };
export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: "parent-child" | "dependency";
};
export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootOrder: string[];
};

export async function buildGraph(taskDir: string): Promise<GraphData> {
  if (!existsSync(taskDir)) {
    return { nodes: [], edges: [], rootOrder: [] };
  }

  const files = readdirSync(taskDir);
  const fileIds = new Set(extractTaskIds(files));
  const index = readIndex(taskDir);

  // index.json に載っているIDのみ対象にする
  const indexIds = new Set<number>();
  for (const ids of Object.values(index.children)) {
    for (const id of ids) indexIds.add(id);
  }
  for (const [key, ids] of Object.entries(index.dependencies)) {
    indexIds.add(Number(key));
    for (const id of ids) indexIds.add(id);
  }
  const allIds = new Set([...indexIds].filter((id) => fileIds.has(id)));

  const nodes: GraphNode[] = [];
  for (const id of allIds) {
    const task = readTask(id, taskDir);
    nodes.push({
      id: String(id),
      title: String(task.title ?? `Task ${id}`),
      status: String(task.status ?? "todo"),
    });
  }

  const edges: GraphEdge[] = [];

  for (const [parentKey, childIds] of Object.entries(index.children)) {
    if (parentKey === "root") continue;
    for (const childId of childIds) {
      if (!allIds.has(childId)) continue;
      edges.push({
        id: `parent-${parentKey}-${childId}`,
        source: parentKey,
        target: String(childId),
        type: "parent-child",
      });
    }
  }

  for (const [taskId, depIds] of Object.entries(index.dependencies)) {
    if (!allIds.has(Number(taskId))) continue;
    for (const depId of depIds) {
      if (!allIds.has(depId)) continue;
      edges.push({
        id: `dep-${depId}-${taskId}`,
        source: String(depId),
        target: taskId,
        type: "dependency",
      });
    }
  }

  const rootOrder = (index.children.root ?? [])
    .filter((id) => allIds.has(id))
    .map(String);

  return { nodes, edges, rootOrder };
}
