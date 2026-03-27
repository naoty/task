import { useParams } from "@tanstack/react-router";

export function TaskDetailRoute() {
  const { id } = useParams({ strict: false });
  return <div>Task {id}</div>;
}
