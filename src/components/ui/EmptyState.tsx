import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {icon}
      </div>
      <h2 className="text-2xl text-text">{title}</h2>
      <div className="mt-2 max-w-md leading-relaxed text-text-muted">{description}</div>
    </div>
  );
}
