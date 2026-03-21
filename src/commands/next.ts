import { list } from "./list";

type Task = {
  id: number;
  title: string;
  status: string;
};

export async function next(taskDir: string): Promise<{ task: Task | null }> {
  const { tasks } = await list(taskDir);
  const task = tasks.find((t) => t.status === "todo") ?? null;
  return { task };
}
