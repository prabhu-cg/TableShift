"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { TableAnalysis, TableColumn } from "@/types/analysis";
import type { ScreenshotInput } from "@/types/screenshot";
import { assessAnalysis, columnConfidenceLevel } from "@/lib/analysis-assessment";
import { deriveFeatures } from "@/lib/features";
import { recommend } from "@/lib/recommendation/engine";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { InfoPanel } from "@/components/ui/InfoPanel";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-text sm:text-4xl">Analysis results</h1>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton variant="secondary" size="sm" onClick={onBack} icon={<ArrowLeft className="size-4" aria-hidden="true" />}>
            Back to screenshot
          </PrimaryButton>
          <PrimaryButton variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="size-4" aria-hidden="true" />}>
            Re-run analysis
          </PrimaryButton>
        </div>
      </div>

      {assessment.status === "blocked" && (
        <ErrorMessage error={{ title: assessment.title!, message: assessment.message! }}>
          <PrimaryButton variant="secondary" size="sm" onClick={onRetry}>
            Retry analysis
          </PrimaryButton>
          <PrimaryButton variant="ghost" size="sm" onClick={onBack}>
            Use a different screenshot
          </PrimaryButton>
        </ErrorMessage>
      )}

      {assessment.status === "caution" && (
        <InfoPanel tone="warning" title="Some of this was hard to read">
          <p>
            Detection confidence is {Math.round(analysis.confidence * 100)}%. Review the detected columns
            before relying on the recommendations.
          </p>
        </InfoPanel>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        {/* Input side: what was analysed */}
        <aside aria-label="Analysed screenshot and summary" className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <figure className="rounded-xl bg-surface-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
            <img
              src={screenshot.previewUrl}
              alt="The screenshot that was analysed"
              className="mx-auto max-h-64 w-auto max-w-full rounded-lg border border-border bg-surface object-contain"
            />
            <figcaption className="mt-2 text-center text-xs text-text-subtle">Original screenshot</figcaption>
          </figure>

          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className="text-2xl text-text">
              Table summary
            </h2>
            <dl className="mt-3 divide-y divide-border rounded-xl border border-border">
              <Row label="Columns" value={String(f.columnCount)} />
              <Row label="Rows read" value={String(f.rowCount)} />
              <Row
                label="Actions"
                value={
                  analysis.actions.length
                    ? analysis.actions.map((a) => a.label).filter(Boolean).join(", ") || String(analysis.actions.length)
                    : "None"
                }
              />
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-text-subtle">Detection</dt>
                <dd>
                  <ConfidenceBadge level={overall} value={analysis.confidence} />
                </dd>
              </div>
              <Row label="Traits" value={traits(f) || "None notable"} />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-text-subtle">
              Table structure was read by AI ({providerLabel(provider.name)}, {provider.model}). Rankings
              come from TableShift&rsquo;s own rules, not from the AI.
            </p>
          </section>

          {(analysis.observations.length > 0 || analysis.warnings.length > 0) && (
            <section aria-labelledby="obs-title" className="rounded-xl bg-surface-muted p-4">
              <h3 id="obs-title" className="flex items-center gap-2 text-text">
                Observations <SourceTag kind="ai" />
              </h3>
              <ul className="mt-3 space-y-1.5 leading-relaxed text-text-muted">
                {analysis.observations.map((o, i) => (
                  <li key={`o${i}`}>• {o}</li>
                ))}
                {analysis.warnings.map((w, i) => (
                  <li key={`w${i}`} className="text-text">
                    <span className="font-medium">Warning:</span> {w}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        {/* Output side: structure, then recommendations */}
        {assessment.status !== "blocked" && (
          <div className="min-w-0 space-y-10">
            <ColumnReview
              columns={columns}
              original={analysis.columns}
              onChange={(id, patch) => setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }))}
              onReset={() => setEdits({})}
            />

            {result && (
              <section aria-labelledby="recs-title" className="space-y-5">
                <div className="max-w-xl">
                  <h2 id="recs-title" className="text-3xl text-text">
                    Recommended mobile layouts
                  </h2>
                  <p className="mt-1 leading-relaxed text-text-muted">
                    Five patterns were scored against your table&rsquo;s characteristics; these three fit
                    best. Scores come from explicit rules, so the same table always gives the same result.
                  </p>
                </div>
                <div className="space-y-5">
                  {result.recommendations.map((r) => (
                    <RecommendationCard key={r.id} rec={r} />
                  ))}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="font-medium text-text">All patterns evaluated</p>
                  <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-text-muted">
                    {result.evaluated.map((e) => (
                      <li key={e.patternId} className="tabular-nums">
                        {e.pattern}: <span className={e.selected ? "font-medium text-text" : ""}>{e.score}</span>
                        {!e.selected && " (not selected)"}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-text-subtle">{label}</dt>
      <dd className="break-words text-right font-medium text-text">{value}</dd>
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
