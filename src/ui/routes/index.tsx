import dagre from "@dagrejs/dagre";
import {
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useEffect, useState } from "react";

type GraphNode = { id: string; title: string; status: string };
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: "parent-child" | "dependency";
};
type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootOrder: string[];
};

type TaskNodeData = { title: string; status: string; [key: string]: unknown };

const statusBorderColor: Record<string, string> = {
  todo: "var(--color-status-todo)",
  doing: "var(--color-status-doing)",
  done: "var(--color-status-done)",
};

function TaskNode({ data }: NodeProps<Node<TaskNodeData>>) {
  const borderColor = statusBorderColor[data.status] ?? statusBorderColor.todo;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div
        style={{ borderColor }}
        className="w-[160px] rounded-[0.5rem] bg-surface border-2 px-3 py-2 flex flex-col gap-1"
      >
        <span className="text-xs font-medium text-text truncate">
          {data.title}
        </span>
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ color: borderColor }}
        >
          {data.status}
        </span>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

function GroupNode({ data }: NodeProps<Node<TaskNodeData>>) {
  const borderColor = statusBorderColor[data.status] ?? statusBorderColor.todo;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div
        style={{ borderColor, width: "100%", height: "100%" }}
        className="rounded-[0.5rem] border-2 bg-surface flex flex-col"
      >
        <div className="px-3 pt-2 pb-3 flex flex-col gap-1 items-start">
          <span className="text-xs font-medium text-text truncate">
            {data.title}
          </span>
          <span
            className="text-[10px] font-semibold uppercase"
            style={{ color: borderColor }}
          >
            {data.status}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

const nodeTypes = { task: TaskNode, group: GroupNode };

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const CHILD_WIDTH = 160;
const CHILD_HEIGHT = 56;
const GROUP_PADDING = 20;
const GROUP_HEADER = 56;
const CHILD_GAP_H = 60;
const CHILD_GAP_V = 12;

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const w =
      typeof node.style?.width === "number" ? node.style.width : NODE_WIDTH;
    const h =
      typeof node.style?.height === "number" ? node.style.height : NODE_HEIGHT;
    g.setNode(node.id, { width: w, height: h });
  }
  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    const w =
      typeof node.style?.width === "number" ? node.style.width : NODE_WIDTH;
    const h =
      typeof node.style?.height === "number" ? node.style.height : NODE_HEIGHT;
    return { ...node, position: { x: x - w / 2, y: y - h / 2 } };
  });
}

function topoSort(childIds: string[], depEdges: GraphEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const childSet = new Set(childIds);

  for (const id of childIds) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }

  for (const edge of depEdges) {
    if (
      edge.type === "dependency" &&
      childSet.has(edge.source) &&
      childSet.has(edge.target)
    ) {
      adj.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  const queue = childIds.filter((id) => inDegree.get(id) === 0);
  const result: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) break;
    result.push(node);
    for (const neighbor of adj.get(node) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  return result.length === childIds.length ? result : childIds;
}

function assignRanks(
  childIds: string[],
  depEdges: GraphEdge[],
): Map<string, number> {
  const ranks = new Map<string, number>();
  const childSet = new Set(childIds);
  for (const id of childIds) ranks.set(id, 0);

  const sorted = topoSort(childIds, depEdges);
  for (const id of sorted) {
    for (const edge of depEdges) {
      if (
        edge.type === "dependency" &&
        edge.source === id &&
        childSet.has(edge.target)
      ) {
        ranks.set(
          edge.target,
          Math.max(ranks.get(edge.target) ?? 0, (ranks.get(id) ?? 0) + 1),
        );
      }
    }
  }
  return ranks;
}

function buildNodes(data: GraphData): { nodes: Node[]; edges: Edge[] } {
  const parentToChildren = new Map<string, string[]>();
  const childSet = new Set<string>();

  for (const edge of data.edges) {
    if (edge.type === "parent-child") {
      if (!parentToChildren.has(edge.source))
        parentToChildren.set(edge.source, []);
      parentToChildren.get(edge.source)!.push(edge.target);
      childSet.add(edge.target);
    }
  }

  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
  const rfNodes: Node[] = [];

  for (const n of data.nodes) {
    if (childSet.has(n.id)) continue;

    const children = parentToChildren.get(n.id);

    if (children && children.length > 0) {
      const childIds = new Set(children);
      const hasInternalDeps = data.edges.some(
        (e) =>
          e.type === "dependency" &&
          childIds.has(e.source) &&
          childIds.has(e.target),
      );

      let groupWidth: number;
      let groupHeight: number;

      if (hasInternalDeps) {
        // カラムレイアウト（rank別に縦並び、rank間は横に並べる）
        const ranks = assignRanks(children, data.edges);
        const rankToChildren = new Map<number, string[]>();
        for (const childId of children) {
          const rank = ranks.get(childId) ?? 0;
          if (!rankToChildren.has(rank)) rankToChildren.set(rank, []);
          rankToChildren.get(rank)?.push(childId);
        }

        const numCols = Math.max(...ranks.values()) + 1;
        const maxRows = Math.max(
          ...[...rankToChildren.values()].map((v) => v.length),
        );
        const contentHeight =
          maxRows * (CHILD_HEIGHT + CHILD_GAP_V) - CHILD_GAP_V;

        groupWidth =
          numCols * (CHILD_WIDTH + CHILD_GAP_H) -
          CHILD_GAP_H +
          GROUP_PADDING * 2;
        groupHeight = GROUP_HEADER + contentHeight + GROUP_PADDING * 2;

        rfNodes.push({
          id: n.id,
          type: "group",
          data: { title: n.title, status: n.status },
          position: { x: 0, y: 0 },
          style: {
            width: groupWidth,
            height: groupHeight,
            backgroundColor: "transparent",
          },
        });

        for (const [rank, rankChildren] of rankToChildren) {
          const colContentHeight =
            rankChildren.length * (CHILD_HEIGHT + CHILD_GAP_V) - CHILD_GAP_V;
          const colOffsetY = (contentHeight - colContentHeight) / 2;
          for (let row = 0; row < rankChildren.length; row++) {
            const childNode = nodeMap.get(rankChildren[row]);
            if (!childNode) continue;
            rfNodes.push({
              id: childNode.id,
              type: "task",
              data: { title: childNode.title, status: childNode.status },
              parentId: n.id,
              extent: "parent",
              position: {
                x: GROUP_PADDING + rank * (CHILD_WIDTH + CHILD_GAP_H),
                y:
                  GROUP_HEADER +
                  GROUP_PADDING / 2 +
                  colOffsetY +
                  row * (CHILD_HEIGHT + CHILD_GAP_V),
              },
            });
          }
        }
      } else {
        // 縦並び（依存関係なし）
        groupWidth = CHILD_WIDTH + GROUP_PADDING * 2;
        groupHeight =
          GROUP_HEADER +
          children.length * (CHILD_HEIGHT + CHILD_GAP_V) -
          CHILD_GAP_V +
          GROUP_PADDING * 2;

        rfNodes.push({
          id: n.id,
          type: "group",
          data: { title: n.title, status: n.status },
          position: { x: 0, y: 0 },
          style: {
            width: groupWidth,
            height: groupHeight,
            backgroundColor: "transparent",
          },
        });

        for (let i = 0; i < children.length; i++) {
          const childNode = nodeMap.get(children[i]);
          if (!childNode) continue;
          rfNodes.push({
            id: childNode.id,
            type: "task",
            data: { title: childNode.title, status: childNode.status },
            parentId: n.id,
            extent: "parent",
            position: {
              x: GROUP_PADDING,
              y:
                GROUP_HEADER +
                GROUP_PADDING / 2 +
                i * (CHILD_HEIGHT + CHILD_GAP_V),
            },
          });
        }
      }
    } else {
      rfNodes.push({
        id: n.id,
        type: "task",
        data: { title: n.title, status: n.status },
        position: { x: 0, y: 0 },
      });
    }
  }

  const rfEdges: Edge[] = data.edges
    .filter((e) => e.type === "dependency")
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      style: {
        stroke: "var(--color-status-doing)",
        strokeWidth: 1.5,
        strokeDasharray: "5 4",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "var(--color-status-doing)",
      },
    }));

  const topLevelNodes = rfNodes.filter((n) => !n.parentId);
  const layouted = applyDagreLayout(topLevelNodes, rfEdges);

  // rootOrderに従って同じx座標グループ内のノードをy座標で並び替える
  const rootOrderMap = new Map(data.rootOrder.map((id, i) => [id, i]));
  const xBuckets = new Map<number, Node[]>();
  for (const node of layouted) {
    const rx = Math.round(node.position.x);
    if (!xBuckets.has(rx)) xBuckets.set(rx, []);
    xBuckets.get(rx)?.push(node);
  }
  const adjustedPositions = new Map<string, { x: number; y: number }>();
  for (const [, bucket] of xBuckets) {
    const ys = bucket.map((n) => n.position.y).sort((a, b) => a - b);
    const sorted = [...bucket].sort(
      (a, b) =>
        (rootOrderMap.get(a.id) ?? Infinity) -
        (rootOrderMap.get(b.id) ?? Infinity),
    );
    sorted.forEach((node, i) => {
      adjustedPositions.set(node.id, { x: node.position.x, y: ys[i] });
    });
  }
  const positionMap = new Map(
    layouted.map((n) => [n.id, adjustedPositions.get(n.id) ?? n.position]),
  );

  const finalNodes = rfNodes.map((n) =>
    n.parentId ? n : { ...n, position: positionMap.get(n.id) ?? n.position },
  );

  return { nodes: finalNodes, edges: rfEdges };
}

export function IndexRoute() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((data: GraphData) => {
        const { nodes: n, edges: e } = buildNodes(data);
        setNodes(n);
        setEdges(e);
      });
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      ></ReactFlow>
    </div>
  );
}
