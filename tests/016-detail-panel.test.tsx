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

const { IndexRoute } = await import("../src/ui/routes/index");

const graphData = {
  nodes: [{ id: "1", title: "タスクA", status: "todo" }],
  edges: [],
  rootOrder: ["1"],
};

const taskDetail = {
  id: 1,
  title: "タスクA",
  status: "todo",
  body: "タスクの本文",
};

class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  close() {}
}

let fetchSpy: ReturnType<typeof spyOn>;

function makeFetchMock(overrides?: Partial<typeof taskDetail>) {
  const detail = { ...taskDetail, ...overrides };
  return spyOn(globalThis, "fetch").mockImplementation(
    async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/graph")) {
        return new Response(JSON.stringify(graphData), {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.match(/\/api\/tasks\/\d+$/)) {
        return new Response(JSON.stringify(detail), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not Found", { status: 404 });
    },
  );
}

beforeEach(() => {
  (globalThis as unknown as { EventSource: unknown }).EventSource =
    MockEventSource;
  fetchSpy = makeFetchMock();
});

afterEach(() => {
  fetchSpy.mockRestore();
});

async function openPanel() {
  render(<IndexRoute />);
  await waitFor(() => screen.getByTestId("node-1"));
  fireEvent.click(screen.getByTestId("node-1"));
  await waitFor(() => screen.getByText("タスクの本文"));
}

describe("詳細パネル", () => {
  test("ノードクリック後に詳細パネルが表示される", async () => {
    await openPanel();
    expect(screen.getByText("タスクの本文")).toBeInTheDocument();
  });

  test("タイトルが表示される", async () => {
    await openPanel();
    // パネルのヘッダーにタイトルボタンが表示される（グラフノードのタイトルとは別）
    const titleButtons = screen.getAllByRole("button", { name: "タスクA" });
    expect(titleButtons.length).toBeGreaterThan(0);
  });

  test("タイトルをクリックすると編集モードになる", async () => {
    await openPanel();

    const titleButton = screen.getAllByRole("button", { name: "タスクA" })[0];
    fireEvent.click(titleButton);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveValue("タスクA");
    });
  });

  test("Enter キーでタイトルが保存される", async () => {
    fetchSpy.mockRestore();
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/graph")) {
          return new Response(JSON.stringify(graphData), {
            headers: { "Content-Type": "application/json" },
          });
        }
        if (
          url.match(/\/api\/tasks\/\d+$/) &&
          (!init || init.method !== "PATCH")
        ) {
          return new Response(JSON.stringify(taskDetail), {
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.match(/\/api\/tasks\/\d+$/) && init?.method === "PATCH") {
          const body = JSON.parse(init.body as string);
          return new Response(JSON.stringify({ ...taskDetail, ...body }), {
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not Found", { status: 404 });
      },
    );

    await openPanel();

    const titleButton = screen.getAllByRole("button", { name: "タスクA" })[0];
    fireEvent.click(titleButton);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "新しいタイトル" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      const patchCalls = fetchSpy.mock.calls.filter(
        ([url, init]) =>
          String(url).match(/\/api\/tasks\/\d+$/) &&
          (init as RequestInit)?.method === "PATCH",
      );
      expect(patchCalls.length).toBe(1);
      const body = JSON.parse((patchCalls[0][1] as RequestInit).body as string);
      expect(body.title).toBe("新しいタイトル");
    });
  });

  test("Escape キーでタイトル編集がキャンセルされる", async () => {
    await openPanel();

    const titleButton = screen.getAllByRole("button", { name: "タスクA" })[0];
    fireEvent.click(titleButton);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "変更中" } });
    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: "タスクA" }).length,
      ).toBeGreaterThan(0);
    });
  });

  test("ステータスが表示される", async () => {
    await openPanel();
    expect(screen.getByRole("button", { name: /todo/i })).toBeInTheDocument();
  });

  test("ステータスをクリックするとドロップダウンが開く", async () => {
    await openPanel();

    fireEvent.click(screen.getByRole("button", { name: /todo/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /doing/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
    });
  });

  test("ステータスを選択すると PATCH リクエストが送信される", async () => {
    fetchSpy.mockRestore();
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/graph")) {
          return new Response(JSON.stringify(graphData), {
            headers: { "Content-Type": "application/json" },
          });
        }
        if (
          url.match(/\/api\/tasks\/\d+$/) &&
          (!init || init.method !== "PATCH")
        ) {
          return new Response(JSON.stringify(taskDetail), {
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.match(/\/api\/tasks\/\d+$/) && init?.method === "PATCH") {
          const body = JSON.parse(init.body as string);
          return new Response(JSON.stringify({ ...taskDetail, ...body }), {
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not Found", { status: 404 });
      },
    );

    await openPanel();

    fireEvent.click(screen.getByRole("button", { name: /todo/i }));
    await waitFor(() => screen.getByRole("button", { name: /doing/i }));
    fireEvent.click(screen.getByRole("button", { name: /doing/i }));

    await waitFor(() => {
      const patchCalls = fetchSpy.mock.calls.filter(
        ([url, init]) =>
          String(url).match(/\/api\/tasks\/\d+$/) &&
          (init as RequestInit)?.method === "PATCH",
      );
      expect(patchCalls.length).toBe(1);
      const body = JSON.parse((patchCalls[0][1] as RequestInit).body as string);
      expect(body.status).toBe("doing");
    });
  });

  test("× ボタンでパネルが閉じる", async () => {
    await openPanel();

    fireEvent.click(screen.getByRole("button", { name: "×" }));

    await waitFor(() => {
      expect(screen.queryByText("タスクの本文")).not.toBeInTheDocument();
    });
  });

  test("タスク ID がフッターに表示される", async () => {
    await openPanel();

    const footer = screen.getByText(
      (_, element) =>
        !!(
          element?.tagName === "SPAN" &&
          element?.textContent?.replace(/\s/g, "") === "#1"
        ),
    );
    expect(footer).toBeInTheDocument();
  });
});
