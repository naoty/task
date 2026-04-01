import {
  Background,
  BackgroundVariant,
  Handle,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import { buildNodes, type GraphData } from "../build-nodes";

type TaskNodeData = {
  id: string;
  title: string;
  status: string;
  [key: string]: unknown;
};

type TaskDetail = {
  id: number;
  title: string;
  status: string;
  body: string;
  [key: string]: unknown;
};

const EXCLUDED_FIELDS = new Set(["id", "path", "title", "status", "body"]);

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
        className="w-[160px] rounded-[0.5rem] bg-surface border-2 p-3 flex flex-col gap-1 relative cursor-pointer"
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

export function IndexRoute() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState(
    [] as ReturnType<typeof buildNodes>["edges"],
  );
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);

  const fetchGraph = useCallback(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((data: GraphData) => {
        const { nodes: n, edges: e } = buildNodes(data);
        setNodes(n);
        setEdges(e);
      });
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => fetchGraph();
    return () => es.close();
  }, [fetchGraph]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    fetch(`/api/tasks/${node.id}`)
      .then((r) => r.json())
      .then((data: TaskDetail) => setSelectedTask(data));
  }, []);

  const closeModal = useCallback(() => setSelectedTask(null), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeModal]);

  const borderColor =
    statusBorderColor[selectedTask?.status ?? ""] ?? statusBorderColor.todo;

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
        onNodeClick={onNodeClick}
      >
        <Background
          variant={BackgroundVariant.Lines}
          color="rgba(255,255,255,0.08)"
        />
      </ReactFlow>

      {/* backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${selectedTask ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeModal}
      />

      {/* half modal */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-1/2 max-w-[480px] bg-surface/90 backdrop-blur-sm border-l border-border flex flex-col overflow-hidden transition-transform duration-300 ${selectedTask ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between p-4 border-b border-border gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium text-text break-words">
              {selectedTask?.title}
            </span>
            <span
              className="text-[10px] font-semibold uppercase"
              style={{ color: borderColor }}
            >
              {selectedTask?.status}
            </span>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="text-muted hover:text-text text-xl leading-none shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {selectedTask &&
            (() => {
              const extraFields = Object.entries(selectedTask).filter(
                ([k]) => !EXCLUDED_FIELDS.has(k),
              );
              return extraFields.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {extraFields.map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface border border-border text-[10px]"
                    >
                      <span className="text-muted font-medium uppercase">
                        {k}
                      </span>
                      <span className="text-text">{String(v)}</span>
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
          {selectedTask?.body?.trim() ? (
            <pre className="text-xs text-text/80 whitespace-pre-wrap font-mono">
              {selectedTask.body}
            </pre>
          ) : (
            <span className="text-xs text-muted italic">本文なし</span>
          )}
        </div>

        <div className="px-4 pb-3 border-t border-border pt-2">
          <span className="text-[9px] text-muted">#{selectedTask?.id}</span>
        </div>
      </div>
    </div>
  );
}
