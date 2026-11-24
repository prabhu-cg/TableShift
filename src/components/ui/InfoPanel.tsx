import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface InfoPanelProps {
  title: string;
  children: ReactNode;
  id?: string;
}

export function InfoPanel({ title, children, id }: InfoPanelProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="rounded-card border border-line bg-surface p-5"
    >
      <h2
        id={id ? `${id}-title` : undefined}
        className="flex items-center gap-2 text-[0.9375rem] font-semibold"
      >
        <Info className="size-4 text-accent-ink" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}
