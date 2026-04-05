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
import { useCallback, useEffect, useRef, useState } from "react";
import { STATUSES } from "../../task";
import { RichEditor } from "../components/RichEditor";
import { usePanel } from "../hooks/usePanel";
import { useTaskGraph } from "../hooks/useTaskGraph";

const statusBorderColor: Record<string, string> = {
  todo: "var(--color-status-todo)",
  doing: "var(--color-status-doing)",
  done: "var(--color-status-done)",
};

function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = statusBorderColor[value] ?? statusBorderColor.todo;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 -ml-2 px-2 py-0.5 rounded text-[11px] font-semibold uppercase hover:bg-surface transition-colors"
        style={{ color }}
      >
        {value}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 min-w-[96px] rounded-md border border-border-elevated bg-surface-elevated shadow-lg overflow-hidden">
          {STATUSES.map((s) => {
            const c = statusBorderColor[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className={`w-full flex items-center px-3 py-1.5 text-[11px] font-semibold uppercase transition-colors hover:bg-surface ${value === s ? "bg-surface" : ""}`}
                style={{ color: c }}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
        style={{
          borderColor,
          width: "100%",
          height: "100%",
          textAlign: "left",
        }}
        className="rounded-[0.5rem] border-2 bg-surface flex flex-col relative cursor-pointer"
      >
        <div className="w-full p-3 flex flex-col gap-1">
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

function TitleEditor({
  value,
  onSave,
}: {
  value: string;
  onSave: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    onSave(draft);
  }, [draft, onSave]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(value);
  }, [value]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            e.stopPropagation();
            cancel();
          }
        }}
        className="text-base font-medium text-text bg-transparent border-b border-border outline-none w-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-base font-medium text-text break-words text-left hover:opacity-70 transition-opacity cursor-text"
    >
      {value}
    </button>
  );
}

const nodeTypes = { task: TaskNode, group: GroupNode };

export function IndexRoute() {
  const { nodes, edges, selectedTask, setSelectedTask, fetchTask } =
    useTaskGraph();
  const { panelWidth, onResizeMouseDown } = usePanel();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.classList.add("scrollbar-visible");
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      el.classList.remove("scrollbar-visible");
    }, 1000);
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      fetchTask(Number(node.id));
    },
    [fetchTask],
  );

  const closeModal = useCallback(
    () => setSelectedTask(null),
    [setSelectedTask],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeModal]);

  const saveBody = useCallback(
    (body: string) => {
      if (!selectedTask) return;
      fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
    },
    [selectedTask],
  );

  const saveStatus = useCallback(
    (status: string) => {
      if (!selectedTask) return;
      fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
        .then((r) => r.json())
        .then((data: TaskDetail) => setSelectedTask(data));
    },
    [selectedTask, setSelectedTask],
  );

  const saveTitle = useCallback(
    (title: string) => {
      if (!selectedTask || title === selectedTask.title) return;
      fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
        .then((r) => r.json())
        .then((data: TaskDetail) => setSelectedTask(data));
    },
    [selectedTask, setSelectedTask],
  );

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
        onPaneClick={closeModal}
      >
        <Background
          variant={BackgroundVariant.Lines}
          color="rgba(255,255,255,0.08)"
        />
      </ReactFlow>

      {/* half modal */}
      <div
        style={{ width: panelWidth }}
        className={`fixed top-0 right-0 z-50 h-full bg-surface-elevated border-l border-border flex flex-col overflow-hidden transition-transform duration-300 ${selectedTask ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* resize handle */}
        <button
          type="button"
          aria-label="パネル幅を変更"
          onMouseDown={onResizeMouseDown}
          className="absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-border bg-transparent border-none p-0"
        />
        <div className="flex items-start justify-between p-4 border-b border-border-elevated gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            {selectedTask && (
              <TitleEditor
                key={selectedTask.id}
                value={selectedTask.title}
                onSave={saveTitle}
              />
            )}
            {selectedTask && (
              <StatusSelect value={selectedTask.status} onChange={saveStatus} />
            )}
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
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="text-muted hover:text-text text-xl leading-none shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-hide"
        >
          {selectedTask && (
            <RichEditor
              key={selectedTask.id}
              content={selectedTask.body ?? ""}
              onSave={saveBody}
            />
          )}
        </div>

        <div className="px-4 pb-3 border-t border-border-elevated pt-2">
          <span className="text-xs text-muted">#{selectedTask?.id}</span>
        </div>
      </div>
    </div>
  );
}
