import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useEffect, useState } from "react";
import { buildNodes, type GraphData } from "../build-nodes";

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

export function IndexRoute() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState(
    [] as ReturnType<typeof buildNodes>["edges"],
  );

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
