import type { DataType, Importance, TableAnalysis, TableColumn } from "@/types/analysis";
import { deriveFeatures } from "./features";

export function col(
  name: string,
  dataType: DataType,
  importance: Importance,
  sampleValues: string[] = ["x"],
  confidence = 0.95,
): TableColumn {
  return { id: `c-${name}`, name, dataType, importance, sampleValues, confidence };
}

export function analysis(
  columns: TableColumn[],
  opts: { rows?: number; actions?: string[]; confidence?: number } = {},
): TableAnalysis {
  const rows = Array.from({ length: opts.rows ?? 5 }, (_, i) => ({ id: `row-${i + 1}`, values: {} }));
  const actions = (opts.actions ?? []).map((label) => ({ label, type: "button" as const }));
  return {
    contentKind: "table",
    ambiguousMultipleTables: false,
    tableDetected: true,
    confidence: opts.confidence ?? 0.92,
    columns,
    rows,
    actions,
    features: deriveFeatures(columns, rows, actions),
    observations: [],
    warnings: [],
  };
}

/** Invoice-style: several currency columns that must be compared. */
export const financialTable = () =>
  analysis([
    col("Invoice", "text", "primary"),
    col("Client", "text", "primary"),
    col("Net", "currency", "secondary", ["$100.00"]),
    col("Tax", "currency", "secondary", ["$20.00"]),
    col("Total", "currency", "primary", ["$120.00"]),
    col("Due date", "date", "secondary"),
  ]);

/** Small directory-style table of independent records. */
export const contactsTable = () =>
  analysis(
    [
      col("Name", "text", "primary"),
      col("Role", "text", "secondary"),
      col("Status", "status", "secondary", ["Active"]),
    ],
    { actions: ["Edit"] },
  );

/** Wide admin table with long text and few critical columns. */
export const wideAdminTable = () =>
  analysis(
    [
      col("Ticket", "text", "primary"),
      col("Summary", "text", "primary", ["Customer reports that the export button fails when filters are applied"]),
      col("Owner", "text", "secondary"),
      col("Team", "text", "optional"),
      col("Priority", "status", "secondary", ["High"]),
      col("Created", "date", "optional"),
      col("Updated", "date", "optional"),
      col("Channel", "text", "optional"),
      col("Region", "text", "optional"),
    ],
    { rows: 15, actions: ["Open", "Close"] },
  );
