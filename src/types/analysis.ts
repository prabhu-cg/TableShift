import { z } from "zod";

/** Placeholder the vision model must use for text it can see but cannot read. */
export const UNREADABLE = "[unreadable]";

export const DATA_TYPES = [
  "text",
  "number",
  "currency",
  "date",
  "status",
  "boolean",
  "action",
  "unknown",
] as const;
export const IMPORTANCE_LEVELS = ["primary", "secondary", "optional"] as const;

const confidence = z.number().min(0).max(1);

export const tableColumnSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().max(120),
  dataType: z.enum(DATA_TYPES),
  sampleValues: z.array(z.string().max(200)).max(8),
  importance: z.enum(IMPORTANCE_LEVELS),
  confidence,
  /** Spanning header above this column (e.g. "Performance %"); empty or absent when ungrouped. */
  group: z.string().max(80).optional(),
});

/** A titled list inside an expanded row or detail panel (e.g. "Fund Literature": [...]). */
export const rowDetailSchema = z.object({
  heading: z.string().max(80),
  items: z.array(z.string().max(120)).max(12),
});

export const tableRowSchema = z.object({
  id: z.string().min(1).max(40),
  values: z.record(z.string(), z.string().max(300)),
  /** Content visible in an expanded/nested part of this row, if the screenshot shows one open. */
  details: z.array(rowDetailSchema).max(6).optional(),
});

export const tableActionSchema = z.object({
  label: z.string().max(80),
  type: z.enum(["button", "link", "menu", "unknown"]),
});

export const tableFeaturesSchema = z.object({
  columnCount: z.number().int().min(0),
  rowCount: z.number().int().min(0),
  hasActions: z.boolean(),
  hasStatusIndicators: z.boolean(),
  hasFinancialData: z.boolean(),
  hasLongText: z.boolean(),
  hasComparableValues: z.boolean(),
  hasDenseContent: z.boolean(),
  requiresCrossColumnComparison: z.boolean(),
  hasColumnGroups: z.boolean(),
  hasRowDetails: z.boolean(),
});

/** What the screenshot appears to contain overall. */
export const CONTENT_KINDS = ["table", "multiple-tables", "dashboard", "other"] as const;

/**
 * Strict schema for what the VISION MODEL may return. It deliberately contains no
 * features and no scores: those are derived deterministically in code.
 */
export const visionOutputSchema = z.object({
  contentKind: z.enum(CONTENT_KINDS),
  /** True only when several tables are visible and none is clearly the most prominent. */
  ambiguousMultipleTables: z.boolean(),
  tableDetected: z.boolean(),
  confidence,
  columns: z.array(tableColumnSchema).max(40),
  rows: z.array(tableRowSchema).max(40),
  actions: z.array(tableActionSchema).max(20),
  /** AI-inferred observations (shown to users as AI-inferred, never as engine rules). */
  observations: z.array(z.string().max(300)).max(12),
  warnings: z.array(z.string().max(300)).max(12),
});
export type VisionOutput = z.infer<typeof visionOutputSchema>;

export type TableColumn = z.infer<typeof tableColumnSchema>;
export type RowDetail = z.infer<typeof rowDetailSchema>;
export type TableRow = z.infer<typeof tableRowSchema>;
export type TableAction = z.infer<typeof tableActionSchema>;
export type TableFeatures = z.infer<typeof tableFeaturesSchema>;
export type DataType = (typeof DATA_TYPES)[number];
export type Importance = (typeof IMPORTANCE_LEVELS)[number];

/** Final analysis: AI-extracted structure + deterministically derived features. */
export interface TableAnalysis {
  contentKind: (typeof CONTENT_KINDS)[number];
  ambiguousMultipleTables: boolean;
  tableDetected: boolean;
  confidence: number;
  columns: TableColumn[];
  rows: TableRow[];
  actions: TableAction[];
  features: TableFeatures;
  observations: string[];
  warnings: string[];
}

/** Input to a vision provider. Held in memory only. */
export interface ImageInput {
  data: Uint8Array;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
}

export interface VisionAnalysisProvider {
  readonly name: string;
  readonly model: string;
  /** Returns schema-validated vision output. Throws VisionError on any failure. */
  analyseTable(image: ImageInput, signal?: AbortSignal): Promise<VisionOutput>;
}

// ---------- API contract ----------

export type AnalyseErrorCode =
  | "invalid-request"
  | "invalid-image"
  | "unsupported-type"
  | "too-large"
  | "not-configured"
  | "provider-error"
  | "rate-limited"
  | "timeout"
  | "invalid-response";

export interface AnalyseErrorBody {
  ok: false;
  error: { code: AnalyseErrorCode; message: string; retryable: boolean };
}
export interface AnalyseSuccessBody {
  ok: true;
  analysis: TableAnalysis;
  provider: { name: string; model: string };
}
export type AnalyseResponse = AnalyseSuccessBody | AnalyseErrorBody;

export interface ProviderStatus {
  configured: boolean;
  provider: string | null;
  model: string | null;
  /** Safe-to-display note on what configuring is missing. Never contains secrets. */
  issue: string | null;
}
