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
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

export async function buildGraph(taskDir: string): Promise<GraphData> {
  if (!existsSync(taskDir)) {
    return { nodes: [], edges: [] };
  }

  const files = readdirSync(taskDir);
  const allIds = new Set(extractTaskIds(files));
  const index = readIndex(taskDir);

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

  return { nodes, edges };
}
