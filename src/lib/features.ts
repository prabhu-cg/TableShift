import type { TableAction, TableColumn, TableFeatures, TableRow } from "@/types/analysis";

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
  };
}
