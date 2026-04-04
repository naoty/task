import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Node, NodeMouseHandler } from "@xyflow/react";

mock.module("@xyflow/react", () => ({
  ReactFlow: ({
    nodes,
    onNodeClick,
    onPaneClick,
    children,
  }: {
    nodes: Node[];
    onNodeClick: NodeMouseHandler;
    onPaneClick: React.MouseEventHandler;
    children?: React.ReactNode;
  }) => (
    // biome-ignore lint/a11y/noStaticElementInteractions: テスト用モック
    // biome-ignore lint/a11y/useKeyWithClickEvents: テスト用モック
    <div data-testid="react-flow" onClick={onPaneClick}>
      {nodes.map((node) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: テスト用モック
        // biome-ignore lint/a11y/useKeyWithClickEvents: テスト用モック
        <div
          key={node.id}
          data-testid={`node-${node.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(e as unknown as React.MouseEvent, node);
          }}
        >
          {String(node.data.title)}
        </div>
      ))}
      {children}
    </div>
  ),
  Background: () => null,
  Handle: () => null,
  MarkerType: { ArrowClosed: "arrowclosed" },
  BackgroundVariant: { Lines: "lines" },
  Position: { Left: "left", Right: "right" },
}));

// IndexRoute をモック設定後にインポート
const { IndexRoute } = await import("../src/ui/routes/index");

const graphData = {
  nodes: [
    { id: "1", title: "タスクA", status: "todo" },
    { id: "2", title: "タスクB", status: "doing" },
  ],
  edges: [{ id: "dep-1-2", source: "1", target: "2", type: "dependency" }],
  rootOrder: ["1", "2"],
};

const taskDetail = {
  id: 1,
  title: "タスクA",
  status: "todo",
  body: "本文",
};

class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  close() {}
}

let fetchSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  (globalThis as unknown as { EventSource: unknown }).EventSource =
    MockEventSource;

  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/graph")) {
        return new Response(JSON.stringify(graphData), {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.match(/\/api\/tasks\/\d+/)) {
        return new Response(JSON.stringify(taskDetail), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not Found", { status: 404 });
    },
  );
});

afterEach(() => {
  fetchSpy.mockRestore();
});

describe("グラフビュー", () => {
  test("グラフデータを取得してノードが表示される", async () => {
    render(<IndexRoute />);

    await waitFor(() => {
      expect(screen.getByText("タスクA")).toBeInTheDocument();
      expect(screen.getByText("タスクB")).toBeInTheDocument();
    });
  });

  test("ノードをクリックすると詳細パネルが開く", async () => {
    render(<IndexRoute />);

    await waitFor(() => screen.getByTestId("node-1"));
    fireEvent.click(screen.getByTestId("node-1"));

    // 詳細パネルの本文（リッチエディタ）が表示される
    await waitFor(() => {
      expect(screen.getByText("本文")).toBeInTheDocument();
    });
  });

  test("キャンバスをクリックすると詳細パネルが閉じる", async () => {
    render(<IndexRoute />);

    await waitFor(() => screen.getByTestId("node-1"));
    fireEvent.click(screen.getByTestId("node-1"));
    await waitFor(() => screen.getByText("本文"));

    fireEvent.click(screen.getByTestId("react-flow"));

    await waitFor(() => {
      expect(screen.queryByText("本文")).not.toBeInTheDocument();
    });
  });

  test("Escape キーで詳細パネルが閉じる", async () => {
    render(<IndexRoute />);

    await waitFor(() => screen.getByTestId("node-1"));
    fireEvent.click(screen.getByTestId("node-1"));
    await waitFor(() => screen.getByText("本文"));

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("本文")).not.toBeInTheDocument();
    });
  });
});
