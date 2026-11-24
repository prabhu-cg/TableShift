import { Check, Minus, Star } from "lucide-react";
import type { Recommendation } from "@/types/recommendation";
import { CRITERIA } from "@/types/recommendation";
import { CRITERION_LABELS, CRITERION_WEIGHTS } from "@/lib/recommendation/constants";
import { SourceTag } from "@/components/ui/ConfidenceBadge";

const COMPLEXITY: Record<Recommendation["implementationComplexity"], string> = {
  low: "Low build effort",
  medium: "Medium build effort",
  high: "High build effort",
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const top = rec.rank === 1;
  return (
    <article
      aria-labelledby={`rec-${rec.id}`}
      className={`flex flex-col rounded-panel border bg-canvas p-5 shadow-card sm:p-6 ${
        top ? "border-accent" : "border-line"
      }`}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Option {rec.rank}
            </span>
            {top && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
                <Star className="size-3" aria-hidden="true" /> Top recommendation
              </span>
            )}
          </div>
          <h3 id={`rec-${rec.id}`} className="text-lg font-semibold tracking-tight">
            {rec.pattern}
          </h3>
        </div>
        <div className="shrink-0 text-right" aria-label={`Suitability score ${rec.score} out of 100`}>
          <p className="text-3xl font-semibold leading-none tabular-nums">{rec.score}</p>
          <p className="mt-1 text-xs text-ink-muted">/ 100 suitability</p>
        </div>
      </header>

      <p className="mt-4 text-sm leading-relaxed">{rec.rationale}</p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <List title="Advantages" items={rec.advantages} icon={<Check className="size-4 text-success" aria-hidden="true" />} />
        <List title="Limitations" items={rec.limitations} icon={<Minus className="size-4 text-ink-muted" aria-hidden="true" />} />
      </div>

      <dl className="mt-5 space-y-3 rounded-card bg-surface p-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">Visible up front</dt>
          <dd className="mt-1">{rec.visibleFields.join(", ") || "None"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">Secondary</dt>
          <dd className="mt-1">{rec.secondaryFields.join(", ") || "None, all fields visible"}</dd>
        </div>
        <div className="text-ink-muted">{COMPLEXITY[rec.implementationComplexity]}</div>
      </dl>

      <details className="mt-4 group">
        <summary className="cursor-pointer text-sm font-medium text-ink underline-offset-4 hover:underline">
          Interaction and accessibility notes
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <List title="Interaction" items={rec.interactionNotes} />
          <List title="Accessibility" items={rec.accessibilityNotes} />
        </div>
      </details>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-ink underline-offset-4 hover:underline">
          How this score was calculated
        </summary>
        <div className="mt-3 space-y-4">
          <ul className="space-y-2.5">
            {CRITERIA.map((c) => (
              <li key={c}>
                <div className="flex justify-between gap-3 text-sm">
                  <span>
                    {CRITERION_LABELS[c]}{" "}
                    <span className="text-ink-muted">({Math.round(CRITERION_WEIGHTS[c] * 100)}%)</span>
                  </span>
                  <span className="tabular-nums">{rec.scoreBreakdown[c]}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${rec.scoreBreakdown[c]}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {rec.uncappedScore !== rec.score && (
            <p className="text-sm text-ink-muted">
              Weighted score {rec.uncappedScore}, limited to {rec.score} by a hard constraint.
            </p>
          )}
          {rec.ruleNotes.length > 0 && (
            <ul className="space-y-2 text-sm">
              {rec.ruleNotes.map((n, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <SourceTag kind="rules" />
                  <span className="min-w-0 flex-1">
                    {n.kind === "adjustment" && (
                      <span className="mr-1 font-medium tabular-nums">
                        {(n.delta ?? 0) > 0 ? "+" : ""}
                        {n.delta} {CRITERION_LABELS[n.criterion!]}:
                      </span>
                    )}
                    {n.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </article>
  );
}

function List({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-muted">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : <span aria-hidden="true">•</span>}
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
