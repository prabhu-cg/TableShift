"use client";

import { useState } from "react";
import { Check, Minus, Star } from "lucide-react";
import type { TableAnalysis } from "@/types/analysis";
import type { Recommendation } from "@/types/recommendation";
import { CRITERIA } from "@/types/recommendation";
import { CRITERION_LABELS, CRITERION_WEIGHTS } from "@/lib/recommendation/constants";
import { PATTERN_GUIDANCE } from "@/lib/preview/pattern-guidance";
import { MobileLayoutRenderer } from "@/components/preview/MobileLayoutRenderer";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Tabs } from "@/components/ui/Tabs";
import { Bullets } from "./RecommendationDetails";

const COMPLEXITY = { low: "Low", medium: "Medium", high: "High" } as const;

interface CompareViewProps {
  analysis: TableAnalysis;
  recommendations: Recommendation[];
  onOpen: (id: string) => void;
}

/**
 * The three alternatives in one consistent structure. On wide screens they sit side by side;
 * on narrow screens one is shown at a time via tabs, so previews are never squeezed.
 */
export function CompareView({ analysis, recommendations, onOpen }: CompareViewProps) {
  const [active, setActive] = useState(recommendations[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <div className="md:hidden">
        <Tabs
          label="Layout to compare"
          idPrefix="compare"
          value={active}
          onChange={setActive}
          items={recommendations.map((r) => ({ id: r.id, label: `Option ${r.rank}` }))}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {recommendations.map((r) => {
          const g = PATTERN_GUIDANCE[r.patternId];
          return (
            <section
              key={r.id}
              id={`compare-panel-${r.id}`}
              aria-labelledby={`compare-title-${r.id}`}
              className={`min-w-0 space-y-5 rounded-panel border p-4 sm:p-5 ${r.rank === 1 ? "border-primary" : "border-border"} ${
                r.id === active ? "block" : "hidden md:block"
              }`}
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    Option {r.rank}
                    {r.rank === 1 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] normal-case tracking-normal text-primary-text">
                        <Star className="size-3" aria-hidden="true" /> Top
                      </span>
                    )}
                  </p>
                  <h3 id={`compare-title-${r.id}`} className="mt-1 text-base text-text">
                    {r.pattern}
                  </h3>
                </div>
                <div className="shrink-0 text-right" aria-label={`Suitability score ${r.score} out of 100`}>
                  <p className="text-2xl font-semibold leading-none tabular-nums text-text">{r.score}</p>
                  <p className="mt-1 text-xs text-text-subtle">/ 100</p>
                </div>
              </header>

              <PreviewFrame viewportWidth={390} framed label={`${r.pattern} preview`}>
                {(vw) => <MobileLayoutRenderer analysis={analysis} recommendation={r} viewportWidth={vw} />}
              </PreviewFrame>

              <p className="leading-relaxed text-text-muted">{g.summary}</p>

              <dl className="space-y-2 rounded-xl bg-surface-muted p-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-text-subtle">Build effort</dt>
                  <dd className="font-medium text-text">{COMPLEXITY[r.implementationComplexity]}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Up front</dt>
                  <dd className="text-text">{r.visibleFields.join(", ") || "None"}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Moved</dt>
                  <dd className="text-text">{r.secondaryFields.join(", ") || "Nothing: all visible"}</dd>
                </div>
              </dl>

              <Bullets title="Advantages" items={r.advantages.slice(0, 3)} icon={<Check className="size-4 text-success" aria-hidden="true" />} />
              <Bullets title="Limitations" items={r.limitations.slice(0, 3)} icon={<Minus className="size-4 text-text-subtle" aria-hidden="true" />} />

              <div>
                <h4 className="mb-2 text-text">Score breakdown</h4>
                <ul className="space-y-2">
                  {CRITERIA.map((c) => (
                    <li key={c}>
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="text-text-muted">
                          {CRITERION_LABELS[c]} ({Math.round(CRITERION_WEIGHTS[c] * 100)}%)
                        </span>
                        <span className="tabular-nums text-text">{r.scoreBreakdown[c]}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${r.scoreBreakdown[c]}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <PrimaryButton variant="secondary" size="sm" className="w-full" onClick={() => onOpen(r.id)}>
                Open in preview
              </PrimaryButton>
            </section>
          );
        })}
      </div>
    </div>
  );
}
