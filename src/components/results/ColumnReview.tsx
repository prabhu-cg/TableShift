import { RotateCcw } from "lucide-react";
import type { DataType, Importance, TableColumn } from "@/types/analysis";
import { DATA_TYPES, IMPORTANCE_LEVELS, UNREADABLE } from "@/types/analysis";
import { columnConfidenceLevel } from "@/lib/analysis-assessment";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Select } from "@/components/ui/Select";

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

const inputCls =
  "min-h-10 w-full rounded-xl border border-control bg-surface px-3 text-sm text-text transition-colors duration-150 hover:bg-surface-muted";

/**
 * Every detected column in full: name, type and importance are editable, with the confidence level
 * and a few extracted sample values underneath so each correction can be checked against the data.
 */
export function ColumnReview({ columns, original, onChange, onReset }: ColumnReviewProps) {
  const changed = columns.some((c, i) => {
    const o = original[i];
    return o && (c.name !== o.name || c.dataType !== o.dataType || c.importance !== o.importance);
  });

  return (
    <section aria-labelledby="structure-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 id="structure-title" className="text-xl text-text">
            Detected table structure
          </h2>
          <p className="text-xs text-text-subtle">Edits update the recommendations and previews instantly.</p>
        </div>
        {changed && (
          <PrimaryButton variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw className="size-4" aria-hidden="true" />}>
            Reset to detected
          </PrimaryButton>
        )}
      </div>

      <div className="hidden grid-cols-[minmax(0,1fr)_8rem_8rem] gap-3 px-3 text-xs font-medium uppercase tracking-wider text-text-subtle sm:grid" aria-hidden="true">
        <span>Column</span>
        <span>Data type</span>
        <span>Importance</span>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {columns.map((c, i) => {
          const o = original[i];
          const edited = !!o && (c.name !== o.name || c.dataType !== o.dataType || c.importance !== o.importance);
          const level = columnConfidenceLevel(c);
          const readable = c.sampleValues.filter((v) => v && v !== UNREADABLE);
          return (
            <li key={c.id} className="space-y-1 px-3 py-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]">
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor={`${c.id}-name`} className="sr-only">
                    Column {i + 1} name
                  </label>
                  <input
                    id={`${c.id}-name`}
                    className={inputCls}
                    value={c.name}
                    placeholder={`Unnamed column ${i + 1}`}
                    maxLength={120}
                    onChange={(e) => onChange(c.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor={`${c.id}-type`} className="sr-only">
                    Column {i + 1} data type
                  </label>
                  <Select
                    dense
                    id={`${c.id}-type`}
                    value={c.dataType}
                    onChange={(e) => onChange(c.id, { dataType: e.target.value as DataType })}
                  >
                    {DATA_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor={`${c.id}-imp`} className="sr-only">
                    Column {i + 1} importance
                  </label>
                  <Select
                    dense
                    id={`${c.id}-imp`}
                    value={c.importance}
                    onChange={(e) => onChange(c.id, { importance: e.target.value as Importance })}
                  >
                    {IMPORTANCE_LEVELS.map((t) => (
                      <option key={t} value={t}>
                        {IMPORTANCE_LABEL[t]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <ConfidenceBadge level={level} />
                {edited && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-primary-text">
                    Edited
                  </span>
                )}
                <p className="min-w-0 flex-1 basis-40 truncate text-xs text-text-subtle" title={readable.join(" · ")}>
                  {readable.length ? readable.slice(0, 3).join(" · ") : <span className="italic">No readable values</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
