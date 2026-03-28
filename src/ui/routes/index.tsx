import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  status: string;
  children: Task[];
};

const statusColors: Record<string, string> = {
  todo: "text-status-todo bg-status-todo/10",
  doing: "text-status-doing bg-status-doing/10",
  done: "text-status-done bg-status-done/10",
};

function StatusBadge({ status }: { status: string }) {
  const classes = statusColors[status] ?? statusColors.todo;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classes}`}>{status}</span>
  );
}

export function IndexRoute() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data: { tasks: Task[] }) => setTasks(data.tasks));
  }, []);

  return (
    <div className="min-h-screen bg-bg p-8">
      <h1 className="text-2xl font-semibold text-text mb-6">Tasks</h1>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <a
              href={`/tasks/${task.id}`}
              className="flex items-center justify-between p-4 rounded-card bg-surface border border-border hover:border-accent transition-colors"
            >
              <span className="text-text">{task.title}</span>
              <StatusBadge status={task.status} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
