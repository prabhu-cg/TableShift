"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";
import type { TableAnalysis, TableColumn } from "@/types/analysis";
import type { ScreenshotInput } from "@/types/screenshot";
import { assessAnalysis, columnConfidenceLevel } from "@/lib/analysis-assessment";
import { deriveFeatures } from "@/lib/features";
import { recommend } from "@/lib/recommendation/engine";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ConfidenceBadge, SourceTag } from "@/components/ui/ConfidenceBadge";
import { providerLabel } from "@/hooks/useProviderStatus";
import { ColumnReview } from "./ColumnReview";
import { RecommendationCard } from "./RecommendationCard";

interface ResultsViewProps {
  screenshot: ScreenshotInput;
  analysis: TableAnalysis;
  provider: { name: string; model: string };
  onBack: () => void;
  onRetry: () => void;
}

export function ResultsView({ screenshot, analysis, provider, onBack, onRetry }: ResultsViewProps) {
  // User corrections to column label / type / importance, keyed by column id.
  const [edits, setEdits] = useState<Record<string, Partial<TableColumn>>>({});

  const columns = useMemo(
    () => analysis.columns.map((c) => ({ ...c, ...edits[c.id] })),
    [analysis.columns, edits],
  );
  // Features are re-derived from the corrected columns, then the deterministic engine re-runs.
  const corrected = useMemo<TableAnalysis>(
    () => ({ ...analysis, columns, features: deriveFeatures(columns, analysis.rows, analysis.actions) }),
    [analysis, columns],
  );
  const assessment = useMemo(() => assessAnalysis(corrected), [corrected]);
  const result = useMemo(
    () => (assessment.status === "blocked" ? null : recommend(corrected)),
    [assessment.status, corrected],
  );

  const f = corrected.features;
  const overall = columnConfidenceLevel({ name: "x", sampleValues: ["x"], confidence: analysis.confidence });

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Analysis results</h2>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton variant="secondary" onClick={onBack} icon={<ArrowLeft className="size-4" aria-hidden="true" />}>
            Back to screenshot
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={onRetry} icon={<RefreshCw className="size-4" aria-hidden="true" />}>
            Re-run analysis
          </PrimaryButton>
        </div>
      </div>

      {assessment.status === "blocked" && (
        <ErrorMessage error={{ title: assessment.title!, message: assessment.message! }}>
          <PrimaryButton variant="secondary" onClick={onRetry}>
            Retry analysis
          </PrimaryButton>
          <PrimaryButton variant="ghost" onClick={onBack}>
            Use a different screenshot
          </PrimaryButton>
        </ErrorMessage>
      )}

      {assessment.status === "caution" && (
        <div role="status" className="flex items-start gap-3 rounded-card border border-warning/40 bg-accent-soft p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-accent-ink" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Some of this was hard to read.</strong> Detection confidence is{" "}
            {Math.round(analysis.confidence * 100)}%. Review the detected columns below before relying on the
            recommendations.
          </p>
        </div>
      )}

      {/* Summary */}
      <section aria-labelledby="summary-title" className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <figure className="overflow-hidden rounded-card border border-line bg-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
          <img
            src={screenshot.previewUrl}
            alt="The screenshot that was analysed"
            className="mx-auto max-h-64 w-auto max-w-full rounded-control border border-line bg-white object-contain"
          />
          <figcaption className="mt-2 text-center text-xs text-ink-muted">Original screenshot</figcaption>
        </figure>
        <div>
          <h3 id="summary-title" className="text-xl font-semibold tracking-tight">
            Table summary
          </h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Stat label="Columns" value={String(f.columnCount)} />
            <Stat label="Rows read" value={String(f.rowCount)} />
            <Stat label="Actions" value={analysis.actions.length ? analysis.actions.map((a) => a.label).filter(Boolean).join(", ") || String(analysis.actions.length) : "None"} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">Detection</dt>
              <dd className="mt-1">
                <ConfidenceBadge level={overall} value={analysis.confidence} />
              </dd>
            </div>
            <Stat label="Traits" value={traits(f) || "None notable"} className="col-span-2" />
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            Table structure was read by AI ({providerLabel(provider.name)}, {provider.model}). Rankings come
            from TableShift&rsquo;s own rules, not from the AI.
          </p>
        </div>
      </section>

      {analysis.observations.length > 0 || analysis.warnings.length > 0 ? (
        <section aria-labelledby="obs-title" className="rounded-card border border-line bg-surface p-5">
          <h3 id="obs-title" className="flex items-center gap-2 text-[0.9375rem] font-semibold">
            Observations <SourceTag kind="ai" />
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink-muted">
            {analysis.observations.map((o, i) => (
              <li key={`o${i}`}>• {o}</li>
            ))}
            {analysis.warnings.map((w, i) => (
              <li key={`w${i}`} className="text-ink">
                <span className="font-medium">Warning:</span> {w}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {assessment.status !== "blocked" && (
        <>
          <ColumnReview
            columns={columns}
            original={analysis.columns}
            onChange={(id, patch) => setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }))}
            onReset={() => setEdits({})}
          />

          {result && (
            <section aria-labelledby="recs-title" className="space-y-5">
              <div className="max-w-2xl">
                <h2 id="recs-title" className="text-xl font-semibold tracking-tight">
                  Recommended mobile layouts
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  Five patterns were scored against your table&rsquo;s characteristics; these three fit best.
                  Scores are calculated by explicit rules, so the same table always gives the same result.
                </p>
              </div>
              <div className="grid gap-5 lg:grid-cols-1">
                {result.recommendations.map((r) => (
                  <RecommendationCard key={r.id} rec={r} />
                ))}
              </div>
              <div className="rounded-card border border-line p-4 text-sm">
                <p className="font-medium">All patterns evaluated</p>
                <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-ink-muted">
                  {result.evaluated.map((e) => (
                    <li key={e.patternId} className="tabular-nums">
                      {e.pattern}: <span className={e.selected ? "font-medium text-ink" : ""}>{e.score}</span>
                      {!e.selected && " (not selected)"}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="mt-1 break-words text-[0.9375rem] font-medium">{value}</dd>
    </div>
  );
}

function traits(f: TableAnalysis["features"]): string {
  return [
    f.hasFinancialData && "financial data",
    f.requiresCrossColumnComparison && "cross-column comparison",
    f.hasLongText && "long text",
    f.hasDenseContent && "dense",
    f.hasStatusIndicators && "status indicators",
    f.hasActions && "row actions",
  ]
    .filter(Boolean)
    .join(", ");
}
