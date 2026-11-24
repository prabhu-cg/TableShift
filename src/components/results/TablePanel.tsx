import type { TableAnalysis, TableColumn } from "@/types/analysis";
import type { ScreenshotInput } from "@/types/screenshot";
import { columnConfidenceLevel } from "@/lib/analysis-assessment";
import { providerLabel } from "@/hooks/useProviderStatus";
import { ConfidenceBadge, SourceTag } from "@/components/ui/ConfidenceBadge";
import { ColumnReview } from "./ColumnReview";

interface TablePanelProps {
  screenshot: ScreenshotInput;
  analysis: TableAnalysis;
  /** Analysis with the user's corrections applied (features re-derived). */
  corrected: TableAnalysis;
  columns: TableColumn[];
  provider: { name: string; model: string };
  onChange: (id: string, patch: Partial<Pick<TableColumn, "name" | "dataType" | "importance">>) => void;
  onReset: () => void;
  /** Hide the column editor (when analysis was blocked). */
  showColumns?: boolean;
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

function Stat({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs text-text-subtle">{label}</dt>
      <dd className="break-words font-medium text-text">{value}</dd>
    </div>
  );
}

/** What was analysed and what was read from it: screenshot, summary, every detected column, AI observations. */
export function TablePanel({ screenshot, analysis, corrected, columns, provider, onChange, onReset, showColumns = true }: TablePanelProps) {
  const f = corrected.features;
  const overall = columnConfidenceLevel({ name: "x", sampleValues: ["x"], confidence: analysis.confidence });
  const actions = analysis.actions.length ? analysis.actions.map((a) => a.label).filter(Boolean).join(", ") || String(analysis.actions.length) : "None";

  return (
    <div className="space-y-6">
      <section aria-label="Original screenshot and summary" className="flex flex-col gap-4 sm:flex-row">
        <figure className="shrink-0 sm:w-44">
          <div className="rounded-xl bg-surface-muted p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
            <img
              src={screenshot.previewUrl}
              alt="The screenshot that was analysed"
              className="mx-auto max-h-28 w-auto max-w-full rounded-md border border-border bg-surface object-contain"
            />
          </div>
          <figcaption className="mt-1 text-center text-xs text-text-subtle">Original screenshot</figcaption>
        </figure>
        <div className="min-w-0 flex-1">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            <Stat label="Columns" value={String(f.columnCount)} />
            <Stat label="Rows read" value={String(f.rowCount)} />
            <Stat label="Actions" value={actions} />
            <div>
              <dt className="text-xs text-text-subtle">Detection</dt>
              <dd className="mt-0.5">
                <ConfidenceBadge level={overall} value={analysis.confidence} />
              </dd>
            </div>
            <Stat label="Traits" value={traits(f) || "None notable"} wide />
          </dl>
        </div>
      </section>
      <p className="-mt-3 text-xs leading-relaxed text-text-subtle">
        Table structure was read by AI ({providerLabel(provider.name)}, {provider.model}). Rankings come from TableShift&rsquo;s own rules, not from the AI.
      </p>

      {showColumns && <ColumnReview columns={columns} original={analysis.columns} onChange={onChange} onReset={onReset} />}

      {(analysis.observations.length > 0 || analysis.warnings.length > 0) && (
        <section aria-labelledby="obs-title" className="rounded-xl bg-surface-muted p-4">
          <h3 id="obs-title" className="flex items-center gap-2 text-text">
            Observations <SourceTag kind="ai" />
          </h3>
          <ul className="mt-2 space-y-1 leading-relaxed text-text-muted">
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
    </div>
  );
}
