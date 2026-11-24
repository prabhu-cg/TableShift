import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-card border border-line bg-canvas text-ink shadow-card">
        {icon}
      </div>
      <p className="text-xl font-semibold tracking-tight text-ink">{title}</p>
      <div className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink-muted">
        {description}
      </div>
    </div>
  );
}
