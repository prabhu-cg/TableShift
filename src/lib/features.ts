import type { TableAction, TableColumn, TableFeatures, TableRow } from "@/types/analysis";
import { UNREADABLE } from "@/types/analysis";

const FINANCIAL_NAME = /\b(amount|price|cost|revenue|balance|total|fee|fees|spend|budget|paid|due|invoice|payment|salary|tax|profit|margin|mrr|arr)\b/i;

const isNumeric = (c: TableColumn) => c.dataType === "number" || c.dataType === "currency";

// Numbers that name or reach a record rather than measure something: IDs, phone numbers, postcodes.
const IDENTIFIER_NAME = /\b(id|ids|ref|reference|phone|mobile|tel|telephone|fax|zip|postcode|postal|sku|pin)\b/i;
const LONG_DIGITS = /^\d{9,}$/;

/** True when a numeric-looking column is really an identifier (so it can't be compared like a quantity). */
export function isIdentifierLike(c: TableColumn): boolean {
  if (IDENTIFIER_NAME.test(c.name)) return true;
  const samples = c.sampleValues.map((v) => v.trim()).filter(Boolean);
  if (samples.some((v) => /^[+#]/.test(v))) return true;
  return samples.length > 0 && samples.every((v) => LONG_DIGITS.test(v.replace(/[\s-]/g, "")));
}

/** A number or currency column that holds comparable quantities (not an ID or phone number). */
export const isMeasure = (c: TableColumn) => isNumeric(c) && !isIdentifierLike(c);

/** Columns that carry data (excludes action columns). */
export const dataColumns = (columns: TableColumn[]) => columns.filter((c) => c.dataType !== "action");

/** Stable display label for a column (used by the UI and by field lists). */
export const columnName = (c: TableColumn, index: number) => c.name.trim() || `Column ${index + 1}`;
/** Label that keeps a column's group, so "YTD" under "Performance %" never reads as a bare "YTD". */
export const columnLabel = (c: TableColumn, index: number) => {
  const group = c.group?.trim();
  return group ? `${group} · ${columnName(c, index)}` : columnName(c, index);
};

/**
 * Deterministically derive table features from columns, rows and actions.
 * Called on the server after extraction and again in the browser whenever the
 * user corrects a column, so recommendations always reflect the corrected data.
 */
export function deriveFeatures(
  columns: TableColumn[],
  rows: TableRow[],
  actions: TableAction[],
): TableFeatures {
  const data = dataColumns(columns);
  const numeric = data.filter(isMeasure);

  const hasFinancialData =
    data.some((c) => c.dataType === "currency") ||
    data.some((c) => c.dataType === "number" && FINANCIAL_NAME.test(c.name));

  const textLengths = data.flatMap((c) =>
    c.dataType === "text" || c.dataType === "unknown" ? c.sampleValues.map((v) => v.length) : [],
  );
  const hasLongText = textLengths.some((len) => len > 40);

  const hasComparableValues = numeric.length >= 2;
  const requiresCrossColumnComparison =
    numeric.length >= 3 || (hasFinancialData && numeric.length >= 2);
  const hasDenseContent = data.length >= 8 || (data.length >= 6 && hasLongText);

  return {
    columnCount: data.length,
    rowCount: rows.length,
    hasActions: actions.length > 0 || columns.some((c) => c.dataType === "action"),
    hasStatusIndicators: data.some((c) => c.dataType === "status"),
    hasFinancialData,
    hasLongText,
    hasComparableValues,
    hasDenseContent,
    requiresCrossColumnComparison,
    hasColumnGroups: columns.some((c) => !!c.group?.trim()),
    hasRowDetails: rows.some((r) => !!r.details?.length),
  };
}

/** Label for columns that sit outside every named group once a table has groups. */
export const UNGROUPED_LABEL = "General";

export interface ColumnGroupInfo {
  /** Group header text, or UNGROUPED_LABEL for columns without one. */
  name: string;
  columnIds: string[];
}

/**
 * Data columns collected under their spanning headers, in first-seen order. Ungrouped columns
 * form one "General" group. Returns [] when the table has no column groups.
 */
export function columnGroups(columns: TableColumn[]): ColumnGroupInfo[] {
  const data = dataColumns(columns);
  if (!data.some((c) => c.group?.trim())) return [];
  const groups: ColumnGroupInfo[] = [];
  for (const c of data) {
    const name = c.group?.trim() || UNGROUPED_LABEL;
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, columnIds: [] }));
    g.columnIds.push(c.id);
  }
  return groups;
}

const norm = (v: string) => v.trim().toLowerCase();

/**
 * The column best suited to split rows into collapsible sections: a status or short-text column
 * with a few repeated values (not an identifier). Null when no column groups the rows usefully.
 */
export function findSectionColumn(columns: TableColumn[], rows: TableRow[]): TableColumn | null {
  if (rows.length < 6) return null;
  let best: { column: TableColumn; score: number } | null = null;
  for (const c of dataColumns(columns)) {
    if (c.dataType !== "status" && c.dataType !== "text") continue;
    if (isIdentifierLike(c)) continue;
    const values = rows
      .map((r) => r.values[c.id])
      .filter((v): v is string => !!v && v !== UNREADABLE)
      .map(norm);
    if (values.length < rows.length * 0.6) continue;
    const distinct = new Set(values).size;
    if (distinct < 2 || distinct > Math.min(6, Math.floor(values.length / 2))) continue;
    if (values.some((v) => v.length > 40)) continue;
    // Prefer status columns, then fewer, more even sections.
    const score = (c.dataType === "status" ? 10 : 0) - distinct;
    if (!best || score > best.score) best = { column: c, score };
  }
  return best?.column ?? null;
}
