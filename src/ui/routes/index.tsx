import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  status: string;
  children: Task[];
};

export function IndexRoute() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data: { tasks: Task[] }) => setTasks(data.tasks));
  }, []);

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <a href={`/tasks/${task.id}`}>{task.title}</a> [{task.status}]
        </li>
      ))}
    </ul>
  );
}
