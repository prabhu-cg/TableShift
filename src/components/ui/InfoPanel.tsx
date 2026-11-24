import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface InfoPanelProps {
  title?: string;
  children: ReactNode;
  tone?: "neutral" | "warning";
}

/** Inline notice on a sand wash. No resting shadow. */
export function InfoPanel({ title, children, tone = "neutral" }: InfoPanelProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        tone === "warning" ? "border-warning/40 bg-accent" : "border-border bg-surface-muted"
      }`}
    >
      <Info
        className={`mt-0.5 size-4 shrink-0 ${tone === "warning" ? "text-warning" : "text-primary-text"}`}
        aria-hidden="true"
      />
      <div className="min-w-0 space-y-1 leading-relaxed text-text-muted">
        {title && <p className="font-semibold text-text">{title}</p>}
        {children}
      </div>
    </div>
  );
}
