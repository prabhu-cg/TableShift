import { CONFIDENCE_LABEL, type ConfidenceLevel } from "@/lib/analysis-assessment";

const DOT: Record<ConfidenceLevel, string> = {
  detected: "bg-success",
  partial: "bg-warning",
  uncertain: "bg-error",
  missing: "bg-ink-muted",
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
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink"
    >
      <span className={`size-2 rounded-full ${DOT[level]}`} aria-hidden="true" />
      {CONFIDENCE_LABEL[level]}
      {value !== undefined && <span className="text-ink-muted tabular-nums">{Math.round(value * 100)}%</span>}
      <span className="sr-only">. {HELP[level]}</span>
    </span>
  );
}

/** Tags where a statement came from: the vision model or the rules engine. */
export function SourceTag({ kind }: { kind: "ai" | "rules" }) {
  return kind === "ai" ? (
    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-accent-ink">
      AI-inferred
    </span>
  ) : (
    <span className="rounded bg-surface px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink border border-line">
      Rule applied
    </span>
  );
}
