import { expect, test } from "bun:test";
import {
  assignRanks,
  buildNodes,
  CHILD_GAP_V,
  CHILD_HEIGHT,
  CHILD_WIDTH,
  GROUP_HEADER,
  GROUP_PADDING,
  type GraphData,
} from "./build-nodes";

// テストデータ作成ヘルパー
function node(id: string, title = `Task ${id}`, status = "todo") {
  return { id, title, status };
}

function parentChildEdge(parentId: string, childId: string) {
  return {
    id: `pc-${parentId}-${childId}`,
    source: parentId,
    target: childId,
    type: "parent-child" as const,
  };
}

function depEdge(from: string, to: string) {
  return {
    id: `dep-${from}-${to}`,
    source: from,
    target: to,
    type: "dependency" as const,
  };
}

function makeGraph(
  nodes: ReturnType<typeof node>[],
  edges: ReturnType<typeof parentChildEdge | typeof depEdge>[],
  rootOrder?: string[],
): GraphData {
  return {
    nodes,
    edges,
    rootOrder: rootOrder ?? nodes.map((n) => n.id),
  };
}

// -------------------------------------------------------------------
// assignRanks のテスト
// -------------------------------------------------------------------

test("assignRanks: 依存関係なしの場合はすべてrank 0", () => {
  const childIds = ["a", "b", "c"];
  const edges: GraphData["edges"] = [];
  const ranks = assignRanks(childIds, edges);
  expect(ranks.get("a")).toBe(0);
  expect(ranks.get("b")).toBe(0);
  expect(ranks.get("c")).toBe(0);
});

test("assignRanks: 線形依存 a→b→c のrank", () => {
  // source が前提条件、target が依存する側
  const childIds = ["a", "b", "c"];
  const edges: GraphData["edges"] = [depEdge("a", "b"), depEdge("b", "c")];
  const ranks = assignRanks(childIds, edges);
  expect(ranks.get("a")).toBe(0);
  expect(ranks.get("b")).toBe(1);
  expect(ranks.get("c")).toBe(2);
});

test("assignRanks: 複数の前提条件がある場合は最大rank+1", () => {
  const childIds = ["a", "b", "c"];
  const edges: GraphData["edges"] = [depEdge("a", "c"), depEdge("b", "c")];
  const ranks = assignRanks(childIds, edges);
  expect(ranks.get("a")).toBe(0);
  expect(ranks.get("b")).toBe(0);
  expect(ranks.get("c")).toBe(1);
});

// -------------------------------------------------------------------
// buildNodes の基本ケース
// -------------------------------------------------------------------

test("buildNodes: 葉ノードはtype=task、parentIdなし", () => {
  const data = makeGraph([node("1")], []);
  const { nodes } = buildNodes(data);

  expect(nodes).toHaveLength(1);
  const n = nodes[0];
  expect(n.id).toBe("1");
  expect(n.type).toBe("task");
  expect(n.parentId).toBeUndefined();
});

test("buildNodes: 子なしノードのデータが正しい", () => {
  const data = makeGraph([node("1", "My Task", "doing")], []);
  const { nodes } = buildNodes(data);

  expect(nodes[0].data).toEqual({
    id: "1",
    title: "My Task",
    status: "doing",
  });
});

test("buildNodes: 子ありノードはtype=group", () => {
  const data = makeGraph([node("1"), node("2")], [parentChildEdge("1", "2")]);
  const { nodes } = buildNodes(data);

  const parent = nodes.find((n) => n.id === "1");
  expect(parent?.type).toBe("group");
});

test("buildNodes: 子ノードにparentIdが設定される", () => {
  const data = makeGraph([node("1"), node("2")], [parentChildEdge("1", "2")]);
  const { nodes } = buildNodes(data);

  const child = nodes.find((n) => n.id === "2");
  expect(child?.parentId).toBe("1");
  expect(child?.extent).toBe("parent");
});

// -------------------------------------------------------------------
// 縦並びレイアウト（依存関係なし）
// -------------------------------------------------------------------

test("buildNodes: 縦並び - 1子のグループサイズ", () => {
  const data = makeGraph([node("1"), node("2")], [parentChildEdge("1", "2")]);
  const { nodes } = buildNodes(data);

  const parent = nodes.find((n) => n.id === "1");
  expect(parent?.style?.width).toBe(CHILD_WIDTH + GROUP_PADDING * 2);
  expect(parent?.style?.height).toBe(
    GROUP_HEADER + CHILD_HEIGHT + GROUP_PADDING * 2,
  );
});

test("buildNodes: 縦並び - 2子のグループサイズ", () => {
  const data = makeGraph(
    [node("1"), node("2"), node("3")],
    [parentChildEdge("1", "2"), parentChildEdge("1", "3")],
  );
  const { nodes } = buildNodes(data);

  const parent = nodes.find((n) => n.id === "1");
  expect(parent?.style?.height).toBe(
    GROUP_HEADER + CHILD_HEIGHT * 2 + CHILD_GAP_V + GROUP_PADDING * 2,
  );
});

test("buildNodes: 縦並び - 1子目のy座標", () => {
  const data = makeGraph(
    [node("1"), node("2"), node("3")],
    [parentChildEdge("1", "2"), parentChildEdge("1", "3")],
  );
  const { nodes } = buildNodes(data);

  const child1 = nodes.find((n) => n.id === "2");
  expect(child1?.position.x).toBe(GROUP_PADDING);
  expect(child1?.position.y).toBe(GROUP_HEADER + GROUP_PADDING / 2);
});

test("buildNodes: 縦並び - 2子目はCHILD_HEIGHT+CHILD_GAP_V分下", () => {
  const data = makeGraph(
    [node("1"), node("2"), node("3")],
    [parentChildEdge("1", "2"), parentChildEdge("1", "3")],
  );
  const { nodes } = buildNodes(data);

  const child2 = nodes.find((n) => n.id === "3");
  expect(child2?.position.y).toBe(
    GROUP_HEADER + GROUP_PADDING / 2 + CHILD_HEIGHT + CHILD_GAP_V,
  );
});

// -------------------------------------------------------------------
// 3階層ネスト
// -------------------------------------------------------------------

test("buildNodes: 3階層 - 孫ノードにparentIdが設定される", () => {
  const data = makeGraph(
    [node("1"), node("2"), node("3")],
    [parentChildEdge("1", "2"), parentChildEdge("2", "3")],
  );
  const { nodes } = buildNodes(data);

  const grandchild = nodes.find((n) => n.id === "3");
  expect(grandchild?.parentId).toBe("2");
  expect(grandchild?.type).toBe("task");
});

test("buildNodes: 3階層 - 中間ノードはtype=group", () => {
  const data = makeGraph(
    [node("1"), node("2"), node("3")],
    [parentChildEdge("1", "2"), parentChildEdge("2", "3")],
  );
  const { nodes } = buildNodes(data);

  const middle = nodes.find((n) => n.id === "2");
  expect(middle?.type).toBe("group");
  expect(middle?.parentId).toBe("1");
});

test("buildNodes: 3階層 - 孫ノードのx/y座標", () => {
  const data = makeGraph(
    [node("1"), node("2"), node("3")],
    [parentChildEdge("1", "2"), parentChildEdge("2", "3")],
  );
  const { nodes } = buildNodes(data);

  // 孫は中間グループ内の最初の子なので位置は GROUP_PADDING, GROUP_HEADER+GROUP_PADDING/2
  const grandchild = nodes.find((n) => n.id === "3");
  expect(grandchild?.position.x).toBe(GROUP_PADDING);
  expect(grandchild?.position.y).toBe(GROUP_HEADER + GROUP_PADDING / 2);
});

// -------------------------------------------------------------------
// 列レイアウト（依存関係あり）
// -------------------------------------------------------------------

test("buildNodes: 列レイアウト - 依存する側が右列に配置される", () => {
  // a→b の依存: b は a の右列
  const data = makeGraph(
    [node("parent"), node("a"), node("b")],
    [
      parentChildEdge("parent", "a"),
      parentChildEdge("parent", "b"),
      depEdge("a", "b"),
    ],
  );
  const { nodes } = buildNodes(data);

  const childA = nodes.find((n) => n.id === "a");
  const childB = nodes.find((n) => n.id === "b");
  // b は a より右（x座標が大きい）
  expect(childB?.position.x).toBeGreaterThan(childA?.position.x);
});

test("buildNodes: 列レイアウト - 同列の複数ノードは縦に並ぶ", () => {
  // c と d は同列（どちらも e に依存される）
  const data = makeGraph(
    [node("parent"), node("c"), node("d"), node("e")],
    [
      parentChildEdge("parent", "c"),
      parentChildEdge("parent", "d"),
      parentChildEdge("parent", "e"),
      depEdge("c", "e"),
      depEdge("d", "e"),
    ],
  );
  const { nodes } = buildNodes(data);

  const childC = nodes.find((n) => n.id === "c");
  const childD = nodes.find((n) => n.id === "d");
  // c と d は同じ x 座標
  expect(childC?.position.x).toBe(childD?.position.x);
  // y は異なる（縦に並ぶ）
  expect(childC?.position.y).not.toBe(childD?.position.y);
});

// -------------------------------------------------------------------
// エッジ変換
// -------------------------------------------------------------------

test("buildNodes: 列レイアウト - 列幅はランクごとの最大幅を使う", () => {
  // subtask_b (rank 0, 葉) → subtask_a (rank 1, サブサブタスクあり)
  // subtask_a は内部deps でカラムレイアウト → 幅 420
  // subtask_b の幅は 160 のまま
  // 正しくは rank0幅=160, rank1幅=420 でカラム間隔を計算する
  const data = makeGraph(
    [
      node("parent"),
      node("subtask_a"),
      node("subtask_b"),
      node("sub1"),
      node("sub2"),
    ],
    [
      parentChildEdge("parent", "subtask_b"),
      parentChildEdge("parent", "subtask_a"),
      parentChildEdge("subtask_a", "sub1"),
      parentChildEdge("subtask_a", "sub2"),
      depEdge("sub1", "sub2"), // subtask_a 内部の依存
      depEdge("subtask_b", "subtask_a"), // subtask_b が先
    ],
  );
  const { nodes } = buildNodes(data);

  const subtaskB = nodes.find((n) => n.id === "subtask_b");
  const subtaskA = nodes.find((n) => n.id === "subtask_a");

  // subtask_b の右端と subtask_a の左端の間隔が CHILD_GAP_H (60) であること
  const subtaskBRight = (subtaskB?.position.x ?? 0) + CHILD_WIDTH;
  const subtaskALeft = subtaskA?.position.x ?? 0;
  expect(subtaskALeft - subtaskBRight).toBe(60); // CHILD_GAP_H
});

test("buildNodes: dependency エッジのみ出力に含まれる", () => {
  const data = makeGraph(
    [node("1"), node("2"), node("3")],
    [parentChildEdge("1", "2"), depEdge("2", "3")],
    ["1", "3"],
  );
  const { edges } = buildNodes(data);

  // parent-child エッジは含まれない
  expect(edges).toHaveLength(1);
  expect(edges[0].source).toBe("2");
  expect(edges[0].target).toBe("3");
});

test("buildNodes: 依存エッジにスタイルが設定される", () => {
  const data = makeGraph(
    [node("1"), node("2")],
    [depEdge("1", "2")],
    ["1", "2"],
  );
  const { edges } = buildNodes(data);

  expect(edges[0].style?.strokeWidth).toBe(1.5);
  expect(edges[0].style?.strokeDasharray).toBe("5 4");
  expect(edges[0].markerEnd).toBeDefined();
});
