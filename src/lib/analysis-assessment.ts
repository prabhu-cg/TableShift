import type { TableAnalysis } from "@/types/analysis";
import { CAUTION_CONFIDENCE, MIN_CONFIDENCE } from "./recommendation/constants";

export type AssessmentStatus = "ready" | "caution" | "blocked";
export type BlockReason = "dashboard" | "other-content" | "multiple-tables" | "no-table" | "low-confidence";

export interface Assessment {
  status: AssessmentStatus;
  reason?: BlockReason;
  title?: string;
  message?: string;
}

/** Decides whether an analysis is trustworthy enough to produce recommendations. */
export function assessAnalysis(a: TableAnalysis): Assessment {
  if (a.contentKind === "dashboard")
    return {
      status: "blocked",
      reason: "dashboard",
      title: "This looks like a dashboard, not a data table",
      message:
        "TableShift supports data tables only. Crop the screenshot to a single table (rows and column headers) and try again.",
    };
  if (a.contentKind === "other")
    return {
      status: "blocked",
      reason: "other-content",
      title: "No data table found",
      message:
        "The screenshot doesn't appear to contain a data table. Paste a screenshot that shows column headers and rows.",
    };
  if (a.ambiguousMultipleTables || a.contentKind === "multiple-tables")
    return {
      status: "blocked",
      reason: "multiple-tables",
      title: "More than one table is visible",
      message:
        "It isn't clear which table to analyse. Crop the screenshot to the one table you want, or provide a clearer screenshot.",
    };
  if (!a.tableDetected || a.features.columnCount < 2)
    return {
      status: "blocked",
      reason: "no-table",
      title: "A table couldn't be identified",
      message:
        "The model couldn't find a table with at least two columns. Check that headers and rows are visible and legible, then retry.",
    };
  if (a.confidence < MIN_CONFIDENCE)
    return {
      status: "blocked",
      reason: "low-confidence",
      title: "The table couldn't be read confidently",
      message: `Detection confidence was ${Math.round(a.confidence * 100)}%, too low for useful recommendations. Try a larger, sharper screenshot of the table.`,
    };
  if (a.confidence < CAUTION_CONFIDENCE) return { status: "caution" };
  return { status: "ready" };
}

export type ConfidenceLevel = "detected" | "partial" | "uncertain" | "missing";

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  detected: "Detected",
  partial: "Partial",
  uncertain: "Uncertain",
  missing: "Missing",
};

/** Per-column confidence indicator. "Missing" = no readable header and no readable values. */
export function columnConfidenceLevel(c: {
  name: string;
  sampleValues: string[];
  confidence: number;
}): ConfidenceLevel {
  if (!c.name.trim() && c.sampleValues.length === 0) return "missing";
  if (c.confidence >= 0.8 && c.name.trim()) return "detected";
  if (c.confidence >= 0.5) return "partial";
  return "uncertain";
}
