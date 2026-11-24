import type { TableAction, TableColumn, TableFeatures, TableRow } from "@/types/analysis";

const FINANCIAL_NAME = /\b(amount|price|cost|revenue|balance|total|fee|fees|spend|budget|paid|due|invoice|payment|salary|tax|profit|margin|mrr|arr)\b/i;

const isNumeric = (c: TableColumn) => c.dataType === "number" || c.dataType === "currency";

/** Columns that carry data (excludes action columns). */
export const dataColumns = (columns: TableColumn[]) => columns.filter((c) => c.dataType !== "action");

/** Stable display label for a column (used by the UI and by field lists). */
export const columnLabel = (c: TableColumn, index: number) => c.name.trim() || `Column ${index + 1}`;

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
  const numeric = data.filter(isNumeric);

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
  };
}
