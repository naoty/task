import type { Node } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import { buildNodes, type GraphData } from "../build-nodes";

type TaskDetail = {
  id: number;
  title: string;
  status: string;
  body: string;
  [key: string]: unknown;
};

export function useTaskGraph() {
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

  const fetchTask = useCallback((id: number) => {
    fetch(`/api/tasks/${id}`)
      .then((r) => r.json())
      .then((data: TaskDetail) => setSelectedTask(data));
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => {
      fetchGraph();
      if (selectedTask) {
        fetchTask(selectedTask.id);
      }
    };
    return () => es.close();
  }, [fetchGraph, fetchTask, selectedTask]);

  return { nodes, edges, selectedTask, setSelectedTask, fetchTask };
}
