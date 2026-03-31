import dagre from "@dagrejs/dagre";
import { type Edge, MarkerType, type Node } from "@xyflow/react";

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

export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 60;
export const CHILD_WIDTH = 160;
export const CHILD_HEIGHT = 64;
export const GROUP_PADDING = 20;
export const GROUP_HEADER = 56;
export const CHILD_GAP_H = 60;
export const CHILD_GAP_V = 12;

export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const w =
      typeof node.style?.width === "number" ? node.style.width : NODE_WIDTH;
    const h =
      typeof node.style?.height === "number" ? node.style.height : CHILD_HEIGHT;
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
      typeof node.style?.height === "number" ? node.style.height : CHILD_HEIGHT;
    return { ...node, position: { x: x - w / 2, y: y - h / 2 } };
  });
}

export function topoSort(childIds: string[], depEdges: GraphEdge[]): string[] {
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

export function assignRanks(
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

export function buildNodes(data: GraphData): { nodes: Node[]; edges: Edge[] } {
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

  const nodeToParent = new Map<string, string>();
  for (const [parentId, children] of parentToChildren) {
    for (const childId of children) {
      nodeToParent.set(childId, parentId);
    }
  }

  function getTopLevelAncestor(nodeId: string): string {
    let current = nodeId;
    while (childSet.has(current)) {
      current = nodeToParent.get(current) ?? current;
    }
    return current;
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
      // カラムレイアウト: 列ごとの実際の高さを使って計算
      const ranks = assignRanks(children, data.edges);
      const rankToChildren = new Map<number, string[]>();
      for (const childId of children) {
        const rank = ranks.get(childId) ?? 0;
        if (!rankToChildren.has(rank)) rankToChildren.set(rank, []);
        rankToChildren.get(rank)?.push(childId);
      }
      const numCols = Math.max(...ranks.values()) + 1;
      const rankWidths = new Map<number, number>();
      for (const [rank, rankChildren] of rankToChildren) {
        rankWidths.set(
          rank,
          Math.max(...rankChildren.map((id) => getNodeSize(id).width)),
        );
      }
      let totalContentWidth = 0;
      for (let r = 0; r < numCols; r++) {
        totalContentWidth += rankWidths.get(r) ?? 0;
      }
      totalContentWidth += (numCols - 1) * CHILD_GAP_H;
      const contentHeight = Math.max(
        ...[...rankToChildren.values()].map((rankChildren) => {
          const heights = rankChildren.map((id) => getNodeSize(id).height);
          return (
            heights.reduce((sum, h) => sum + h, 0) +
            (rankChildren.length - 1) * CHILD_GAP_V
          );
        }),
      );
      return {
        width: totalContentWidth + GROUP_PADDING * 2,
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
      const numCols = Math.max(...ranks.values()) + 1;
      const rankWidths = new Map<number, number>();
      for (const [rank, rankChildren] of rankToChildren) {
        rankWidths.set(
          rank,
          Math.max(...rankChildren.map((id) => getNodeSize(id).width)),
        );
      }
      const rankXOffsets = new Map<number, number>();
      let cumulativeX = 0;
      for (let r = 0; r < numCols; r++) {
        rankXOffsets.set(r, cumulativeX);
        cumulativeX += (rankWidths.get(r) ?? 0) + CHILD_GAP_H;
      }
      const contentHeight = Math.max(
        ...[...rankToChildren.values()].map((rankChildren) => {
          const heights = rankChildren.map((id) => getNodeSize(id).height);
          return (
            heights.reduce((sum, h) => sum + h, 0) +
            (rankChildren.length - 1) * CHILD_GAP_V
          );
        }),
      );
      for (const [rank, rankChildren] of rankToChildren) {
        const colSizes = rankChildren.map((id) => getNodeSize(id));
        const colContentHeight =
          colSizes.reduce((sum, s) => sum + s.height, 0) +
          (rankChildren.length - 1) * CHILD_GAP_V;
        const colOffsetY = (contentHeight - colContentHeight) / 2;
        let itemY = GROUP_HEADER + GROUP_PADDING / 2 + colOffsetY;
        for (let row = 0; row < rankChildren.length; row++) {
          processNode(rankChildren[row], nodeId, {
            x: GROUP_PADDING + (rankXOffsets.get(rank) ?? 0),
            y: itemY,
          });
          itemY += colSizes[row].height + CHILD_GAP_V;
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
  const dagreEdges = rfEdges
    .map((e) => ({
      ...e,
      source: getTopLevelAncestor(e.source),
      target: getTopLevelAncestor(e.target),
    }))
    .filter((e) => e.source !== e.target);
  const layouted = applyDagreLayout(topLevelNodes, dagreEdges);

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
          : CHILD_HEIGHT;
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
