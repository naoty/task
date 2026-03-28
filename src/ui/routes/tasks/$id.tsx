import { useParams } from "@tanstack/react-router";

export function TaskDetailRoute() {
  const { id } = useParams({ strict: false });
  return (
    <div className="min-h-screen bg-bg p-8">
      <a
        href="/"
        className="text-sm text-muted hover:text-text mb-6 inline-block transition-colors"
      >
        ← Back
      </a>
      <div className="p-6 rounded-card bg-surface border border-border">
        <h1 className="text-xl font-semibold text-text">Task {id}</h1>
      </div>
    </div>
  );
}
