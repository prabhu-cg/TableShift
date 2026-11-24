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
  "min-h-11 w-full rounded-xl border border-control bg-surface px-3 text-sm text-text transition-colors duration-150 hover:bg-surface-muted";
const labelCls = "mb-1 block text-xs font-medium text-text-subtle";

export function ColumnReview({ columns, original, onChange, onReset }: ColumnReviewProps) {
  const changed = columns.some((c, i) => {
    const o = original[i];
    return o && (c.name !== o.name || c.dataType !== o.dataType || c.importance !== o.importance);
  });

  return (
    <section aria-labelledby="structure-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-xl">
          <h2 id="structure-title" className="text-3xl text-text">
            Detected table structure
          </h2>
          <p className="mt-1 leading-relaxed text-text-muted">
            Check what the AI read from your screenshot. Correct a label, data type or importance and the
            recommendations below update straight away.
          </p>
        </div>
        {changed && (
          <PrimaryButton
            variant="ghost"
            size="sm"
            onClick={onReset}
            icon={<RotateCcw className="size-4" aria-hidden="true" />}
          >
            Reset to detected
          </PrimaryButton>
        )}
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {columns.map((c, i) => {
          const o = original[i];
          const edited = !!o && (c.name !== o.name || c.dataType !== o.dataType || c.importance !== o.importance);
          const level = columnConfidenceLevel(c);
          const readable = c.sampleValues.filter((v) => v && v !== UNREADABLE);
          return (
            <li key={c.id} className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
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
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <ConfidenceBadge level={level} />
                {edited && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-primary-text">
                    Edited
                  </span>
                )}
                <p className="min-w-0 flex-1 basis-48 text-text-subtle">
                  {readable.length ? (
                    <span className="line-clamp-1 break-words">{readable.slice(0, 3).join(" · ")}</span>
                  ) : (
                    <span className="italic">No readable values</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
