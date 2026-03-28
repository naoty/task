import { useParams } from "@tanstack/react-router";

export function TaskDetailRoute() {
  const { id } = useParams({ strict: false });
  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8">
      <a
        href="/"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] mb-6 inline-block transition-colors"
      >
        ← Back
      </a>
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          Task {id}
        </h1>
      </div>
    </div>
  );
}
