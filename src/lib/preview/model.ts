import type { DataType, Importance, RowDetail, TableAction, TableAnalysis } from "@/types/analysis";
import { UNREADABLE } from "@/types/analysis";
import type { Recommendation } from "@/types/recommendation";
import { columnConfidenceLevel } from "../analysis-assessment";
import { columnLabel, columnName, dataColumns, isIdentifierLike } from "../features";

/** A source column as the preview renderers see it. Always traceable via `id` / `sourceIndex`. */
export interface PreviewColumn {
  id: string;
  label: string;
  /** The column's own header, without its group. Used under a spanning group header. */
  name: string;
  /** Spanning header above the column, or empty. */
  group: string;
  dataType: DataType;
  importance: Importance;
  /** True when the column was not confidently detected; its values are flagged in the preview. */
  uncertain: boolean;
  /** True for IDs, reference numbers and phone numbers: usable as a field, a poor record title. */
  identifierLike: boolean;
  sourceIndex: number;
}

export type CellState = "value" | "missing" | "unreadable";

export interface PreviewCell {
  state: CellState;
  /** Text to display. For `value` it is exactly the extracted text; never altered. */
  text: string;
}

export interface PreviewRow {
  id: string;
  /** 1-based position in the source table. */
  number: number;
  title: string;
  /** True when no identifier value was readable and the title is just "Record N". */
  titleIsFallback: boolean;
  cells: Record<string, PreviewCell>;
  /** Expanded or nested content captured for this row. */
  details: RowDetail[];
}

export interface FieldGroup {
  key: "details" | "amounts" | "dates";
  label: string;
  columns: PreviewColumn[];
}

export interface PreviewModel {
  /** Every data column in source order (action columns excluded; they surface as `actions`). */
  columns: PreviewColumn[];
  /** Recommendation's up-front columns, in source order. */
  visible: PreviewColumn[];
  /** Everything else: relocated, never dropped. */
  secondary: PreviewColumn[];
  titleColumn: PreviewColumn | null;
  statusColumn: PreviewColumn | null;
  rows: PreviewRow[];
  actions: TableAction[];
  hasLowConfidence: boolean;
  empty: "no-columns" | "no-rows" | null;
}

const FALLBACK_VISIBLE = 4;

export function toCell(value: string | undefined): PreviewCell {
  if (value === undefined || value.trim() === "") return { state: "missing", text: "—" };
  if (value === UNREADABLE) return { state: "unreadable", text: "Unreadable" };
  return { state: "value", text: value };
}

/**
 * Match recommendation field labels back to columns. Duplicate labels are consumed in order,
 * so two columns both called "Status" map to two different columns.
 */
function matchLabels(labels: string[], columns: PreviewColumn[], used: Set<string>): PreviewColumn[] {
  const out: PreviewColumn[] = [];
  for (const label of labels) {
    const col = columns.find((c) => !used.has(c.id) && c.label === label);
    if (col) {
      used.add(col.id);
      out.push(col);
    }
  }
  return out;
}

const bySource = (a: PreviewColumn, b: PreviewColumn) => a.sourceIndex - b.sourceIndex;

/**
 * Build the render model from the extracted analysis and a recommendation.
 * Pure and deterministic. It never invents values and never drops a column:
 * any column the recommendation doesn't name is placed in `secondary`.
 */
export function buildPreviewModel(
  analysis: TableAnalysis,
  recommendation: Recommendation | null | undefined,
): PreviewModel {
  const columns: PreviewColumn[] = dataColumns(analysis.columns).map((c) => ({
    id: c.id,
    label: columnLabel(c, analysis.columns.indexOf(c)),
    name: columnName(c, analysis.columns.indexOf(c)),
    group: c.group?.trim() ?? "",
    dataType: c.dataType,
    importance: c.importance,
    uncertain: columnConfidenceLevel(c) !== "detected",
    identifierLike: isIdentifierLike(c),
    sourceIndex: analysis.columns.indexOf(c),
  }));

  let visible: PreviewColumn[];
  let secondary: PreviewColumn[];
  if (recommendation) {
    const used = new Set<string>();
    const v = matchLabels(recommendation.visibleFields, columns, used);
    const s = matchLabels(recommendation.secondaryFields, columns, used);
    const leftovers = columns.filter((c) => !used.has(c.id));
    visible = [...v].sort(bySource);
    secondary = [...s, ...leftovers].sort(bySource);
  } else {
    visible = columns.slice(0, FALLBACK_VISIBLE);
    secondary = columns.slice(FALLBACK_VISIBLE);
  }

  // The record's title is the human-readable primary column (a name) rather than an ID, when there is one.
  const titleColumn =
    visible.find((c) => c.importance === "primary" && !c.identifierLike) ??
    visible.find((c) => c.importance === "primary") ??
    visible[0] ??
    columns[0] ??
    null;
  const statusColumn = visible.find((c) => c.dataType === "status" && c !== titleColumn) ?? null;

  const rows: PreviewRow[] = analysis.rows.map((r, i) => {
    const cells: Record<string, PreviewCell> = {};
    for (const c of columns) cells[c.id] = toCell(r.values[c.id]);
    const titleCell = titleColumn ? cells[titleColumn.id] : undefined;
    const hasTitle = titleCell?.state === "value";
    return {
      id: r.id,
      number: i + 1,
      title: hasTitle ? titleCell.text : `Record ${i + 1}`,
      titleIsFallback: !hasTitle,
      cells,
      details: r.details ?? [],
    };
  });

  return {
    columns,
    visible,
    secondary,
    titleColumn,
    statusColumn,
    rows,
    actions: analysis.actions,
    hasLowConfidence: columns.some((c) => c.uncertain),
    empty: columns.length === 0 ? "no-columns" : rows.length === 0 ? "no-rows" : null,
  };
}

/** Group related fields by what they are (amounts, dates, everything else). Order is preserved inside a group. */
export function groupFields(columns: PreviewColumn[]): FieldGroup[] {
  const buckets: Record<FieldGroup["key"], PreviewColumn[]> = { details: [], amounts: [], dates: [] };
  for (const c of columns) {
    if (c.dataType === "currency" || c.dataType === "number") buckets.amounts.push(c);
    else if (c.dataType === "date") buckets.dates.push(c);
    else buckets.details.push(c);
  }
  const labels: Record<FieldGroup["key"], string> = { details: "Details", amounts: "Amounts", dates: "Dates" };
  return (Object.keys(buckets) as FieldGroup["key"][])
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, label: labels[k], columns: buckets[k] }));
}

export type StatusTone = "ok" | "warn" | "bad" | "neutral";

const OK = /^(active|paid|complete(d)?|success(ful)?|approved|accepted|confirmed|booked|done|delivered|resolved|online|enabled|shipped|verified|available)$/i;
const WARN = /(pending|processing|review|draft|partial|waiting|scheduled|in progress|on hold|trial)/i;
const BAD = /(failed|overdue|error|cancel(l)?ed|rejected|declined|inactive|blocked|expired|refunded|late|disabled|suspended)/i;

/** Restrained status colour chosen only from the displayed status text; unknown words stay neutral. */
export function statusTone(text: string): StatusTone {
  if (BAD.test(text)) return "bad";
  if (WARN.test(text)) return "warn";
  if (OK.test(text.trim())) return "ok";
  return "neutral";
}

/** A display label for a row action; never invents wording beyond a generic fallback. */
export function actionLabel(a: TableAction): string {
  if (a.label.trim()) return a.label.trim();
  return a.type === "menu" ? "More actions" : "Action";
}
