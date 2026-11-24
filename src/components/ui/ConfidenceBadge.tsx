import { CONFIDENCE_LABEL, type ConfidenceLevel } from "@/lib/analysis-assessment";

const DOT: Record<ConfidenceLevel, string> = {
  detected: "bg-success",
  partial: "bg-warning",
  uncertain: "bg-danger",
  missing: "bg-text-subtle",
};

const HELP: Record<ConfidenceLevel, string> = {
  detected: "Clearly detected",
  partial: "Partially detected, worth checking",
  uncertain: "Uncertain, please verify",
  missing: "Missing or unreadable",
};

export function ConfidenceBadge({ level, value }: { level: ConfidenceLevel; value?: number }) {
  return (
    <span
      title={HELP[level]}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border-strong bg-surface px-2.5 py-1 text-xs font-medium text-text"
    >
      <span className={`size-2 rounded-full ${DOT[level]}`} aria-hidden="true" />
      {CONFIDENCE_LABEL[level]}
      {value !== undefined && <span className="tabular-nums text-text-subtle">{Math.round(value * 100)}%</span>}
      <span className="sr-only">. {HELP[level]}</span>
    </span>
  );
}

/** Tags where a statement came from: the vision model or the rules engine. */
export function SourceTag({ kind }: { kind: "ai" | "rules" }) {
  return kind === "ai" ? (
    <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-primary-text">
      AI-inferred
    </span>
  ) : (
    <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">
      Rule applied
    </span>
  );
}
