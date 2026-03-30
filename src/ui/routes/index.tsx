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

type TaskNodeData = {
  id: string;
  title: string;
  status: string;
  [key: string]: unknown;
};

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
        className="w-[160px] rounded-[0.5rem] bg-surface border-2 p-3 flex flex-col gap-1 relative"
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
        <span className="absolute bottom-1 right-2 text-[9px] text-text/40">
          #{data.id}
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
        className="rounded-[0.5rem] border-2 bg-surface flex flex-col relative"
      >
        <div className="p-3 flex flex-col gap-1 items-start">
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
        <span className="absolute bottom-1 right-2 text-[9px] text-text/40">
          #{data.id}
        </span>
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
      parentToChildren.get(edge.source)?.push(edge.target);
      childSet.add(edge.target);
    }
  }

  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
  const rfNodes: Node[] = [];

  function getNodeSize(nodeId: string): { width: number; height: number } {
    const children = parentToChildren.get(nodeId) ?? [];
    if (children.length === 0) {
      return { width: CHILD_WIDTH, height: CHILD_HEIGHT };
    }

    const childIds = new Set(children);
    const hasInternalDeps = data.edges.some(
      (e) =>
        e.type === "dependency" &&
        childIds.has(e.source) &&
        childIds.has(e.target),
    );

    if (hasInternalDeps) {
      // カラムレイアウト: 子は固定サイズで計算
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
      return {
        width:
          numCols * (CHILD_WIDTH + CHILD_GAP_H) -
          CHILD_GAP_H +
          GROUP_PADDING * 2,
        height: GROUP_HEADER + contentHeight + GROUP_PADDING * 2,
      };
    } else {
      // 縦並び: 子のサイズを再帰的に計算
      const childSizes = children.map((id) => getNodeSize(id));
      const maxChildWidth = Math.max(...childSizes.map((s) => s.width));
      const totalChildHeight =
        childSizes.reduce((sum, s) => sum + s.height, 0) +
        (children.length - 1) * CHILD_GAP_V;
      return {
        width: maxChildWidth + GROUP_PADDING * 2,
        height: GROUP_HEADER + totalChildHeight + GROUP_PADDING * 2,
      };
    }
  }

  function processNode(
    nodeId: string,
    parentId?: string,
    position = { x: 0, y: 0 },
  ) {
    const n = nodeMap.get(nodeId);
    if (!n) return;

    const children = parentToChildren.get(nodeId) ?? [];

    if (children.length === 0) {
      rfNodes.push({
        id: nodeId,
        type: "task",
        data: { id: nodeId, title: n.title, status: n.status },
        position,
        ...(parentId ? { parentId, extent: "parent" as const } : {}),
      });
      return;
    }

    const { width: groupWidth, height: groupHeight } = getNodeSize(nodeId);
    rfNodes.push({
      id: nodeId,
      type: "group",
      data: { id: nodeId, title: n.title, status: n.status },
      position,
      ...(parentId ? { parentId, extent: "parent" as const } : {}),
      style: {
        width: groupWidth,
        height: groupHeight,
        backgroundColor: "transparent",
      },
    });

    const childIds = new Set(children);
    const hasInternalDeps = data.edges.some(
      (e) =>
        e.type === "dependency" &&
        childIds.has(e.source) &&
        childIds.has(e.target),
    );

    if (hasInternalDeps) {
      // カラムレイアウト（rank別に縦並び、rank間は横に並べる）
      const ranks = assignRanks(children, data.edges);
      const rankToChildren = new Map<number, string[]>();
      for (const childId of children) {
        const rank = ranks.get(childId) ?? 0;
        if (!rankToChildren.has(rank)) rankToChildren.set(rank, []);
        rankToChildren.get(rank)?.push(childId);
      }
      const maxRows = Math.max(
        ...[...rankToChildren.values()].map((v) => v.length),
      );
      const contentHeight =
        maxRows * (CHILD_HEIGHT + CHILD_GAP_V) - CHILD_GAP_V;
      for (const [rank, rankChildren] of rankToChildren) {
        const colContentHeight =
          rankChildren.length * (CHILD_HEIGHT + CHILD_GAP_V) - CHILD_GAP_V;
        const colOffsetY = (contentHeight - colContentHeight) / 2;
        for (let row = 0; row < rankChildren.length; row++) {
          processNode(rankChildren[row], nodeId, {
            x: GROUP_PADDING + rank * (CHILD_WIDTH + CHILD_GAP_H),
            y:
              GROUP_HEADER +
              GROUP_PADDING / 2 +
              colOffsetY +
              row * (CHILD_HEIGHT + CHILD_GAP_V),
          });
        }
      }
    } else {
      // 縦並び（依存関係なし）
      let childY = GROUP_HEADER + GROUP_PADDING / 2;
      for (const childId of children) {
        processNode(childId, nodeId, { x: GROUP_PADDING, y: childY });
        childY += getNodeSize(childId).height + CHILD_GAP_V;
      }
    }
  }

  for (const n of data.nodes) {
    if (!childSet.has(n.id)) {
      processNode(n.id);
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
    const halfW =
      typeof node.style?.width === "number"
        ? node.style.width / 2
        : NODE_WIDTH / 2;
    const centerX = Math.round(node.position.x + halfW);
    if (!xBuckets.has(centerX)) xBuckets.set(centerX, []);
    xBuckets.get(centerX)?.push(node);
  }
  const adjustedPositions = new Map<string, { x: number; y: number }>();
  for (const [, bucket] of xBuckets) {
    const sorted = [...bucket].sort(
      (a, b) =>
        (rootOrderMap.get(a.id) ?? Infinity) -
        (rootOrderMap.get(b.id) ?? Infinity),
    );
    const minY = Math.min(...bucket.map((n) => n.position.y));
    let currentY = minY;
    for (const node of sorted) {
      const h =
        typeof node.style?.height === "number"
          ? node.style.height
          : NODE_HEIGHT;
      adjustedPositions.set(node.id, { x: node.position.x, y: currentY });
      currentY += h + 40;
    }
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
