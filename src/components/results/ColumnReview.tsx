import { RotateCcw } from "lucide-react";
import type { DataType, Importance, TableColumn } from "@/types/analysis";
import { DATA_TYPES, IMPORTANCE_LEVELS, UNREADABLE } from "@/types/analysis";
import { columnConfidenceLevel } from "@/lib/analysis-assessment";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

interface ColumnReviewProps {
  columns: TableColumn[];
  original: TableColumn[];
  onChange: (id: string, patch: Partial<Pick<TableColumn, "name" | "dataType" | "importance">>) => void;
  onReset: () => void;
}

const TYPE_LABEL: Record<DataType, string> = {
  text: "Text",
  number: "Number",
  currency: "Currency",
  date: "Date",
  status: "Status",
  boolean: "Yes / No",
  action: "Actions",
  unknown: "Unknown",
};
const IMPORTANCE_LABEL: Record<Importance, string> = {
  primary: "Primary",
  secondary: "Secondary",
  optional: "Optional",
};

const field =
  "min-h-11 w-full rounded-control border border-line-strong bg-canvas px-3 text-[0.9375rem] text-ink";
const labelCls = "mb-1 block text-xs font-medium text-ink-muted md:sr-only";

export function ColumnReview({ columns, original, onChange, onReset }: ColumnReviewProps) {
  const changed = columns.some((c, i) => {
    const o = original[i];
    return o && (c.name !== o.name || c.dataType !== o.dataType || c.importance !== o.importance);
  });

  return (
    <section aria-labelledby="structure-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id="structure-title" className="text-xl font-semibold tracking-tight">
            Detected table structure
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            Check what the AI read from your screenshot. Correct a label, data type or importance and the
            recommendations below update straight away.
          </p>
        </div>
        {changed && (
          <PrimaryButton
            variant="ghost"
            onClick={onReset}
            icon={<RotateCcw className="size-4" aria-hidden="true" />}
          >
            Reset to detected
          </PrimaryButton>
        )}
      </div>

      <div className="overflow-hidden rounded-card border border-line">
        <div
          className="hidden gap-3 border-b border-line bg-surface px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-ink-muted md:grid md:grid-cols-[1.3fr_1fr_1fr_9rem_1.4fr]"
          aria-hidden="true"
        >
          <span>Column</span>
          <span>Data type</span>
          <span>Importance</span>
          <span>Confidence</span>
          <span>Sample values</span>
        </div>
        <ul className="divide-y divide-line">
          {columns.map((c, i) => {
            const o = original[i];
            const edited = !!o && (c.name !== o.name || c.dataType !== o.dataType || c.importance !== o.importance);
            const level = columnConfidenceLevel(c);
            const readable = c.sampleValues.filter((v) => v && v !== UNREADABLE);
            return (
              <li
                key={c.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_1fr_1fr_9rem_1.4fr] md:items-center md:py-3"
              >
                <div>
                  <label htmlFor={`${c.id}-name`} className={labelCls}>
                    Column name
                  </label>
                  <input
                    id={`${c.id}-name`}
                    className={field}
                    value={c.name}
                    placeholder={`Unnamed column ${i + 1}`}
                    maxLength={120}
                    onChange={(e) => onChange(c.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor={`${c.id}-type`} className={labelCls}>
                    Data type
                  </label>
                  <select
                    id={`${c.id}-type`}
                    className={field}
                    value={c.dataType}
                    onChange={(e) => onChange(c.id, { dataType: e.target.value as DataType })}
                  >
                    {DATA_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${c.id}-imp`} className={labelCls}>
                    Importance
                  </label>
                  <select
                    id={`${c.id}-imp`}
                    className={field}
                    value={c.importance}
                    onChange={(e) => onChange(c.id, { importance: e.target.value as Importance })}
                  >
                    {IMPORTANCE_LEVELS.map((t) => (
                      <option key={t} value={t}>
                        {IMPORTANCE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidenceBadge level={level} />
                  {edited && (
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-accent-ink">
                      Edited
                    </span>
                  )}
                </div>
                <p className="min-w-0 text-sm text-ink-muted">
                  {readable.length ? (
                    <span className="line-clamp-2 break-words">{readable.slice(0, 3).join(" · ")}</span>
                  ) : (
                    <span className="italic">No readable values</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
