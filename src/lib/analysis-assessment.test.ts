import { describe, expect, it } from "vitest";
import { assessAnalysis, columnConfidenceLevel } from "./analysis-assessment";
import { analysis, col, contactsTable } from "./test-fixtures";

describe("assessAnalysis", () => {
  it("is ready for a confident table", () => expect(assessAnalysis(contactsTable()).status).toBe("ready"));
  it("cautions on medium confidence", () =>
    expect(assessAnalysis({ ...contactsTable(), confidence: 0.6 }).status).toBe("caution"));
  it("blocks low confidence", () =>
    expect(assessAnalysis({ ...contactsTable(), confidence: 0.3 })).toMatchObject({ status: "blocked", reason: "low-confidence" }));
  it("blocks dashboards", () =>
    expect(assessAnalysis({ ...contactsTable(), contentKind: "dashboard" })).toMatchObject({ reason: "dashboard" }));
  it("blocks ambiguous multiple tables", () =>
    expect(assessAnalysis({ ...contactsTable(), ambiguousMultipleTables: true })).toMatchObject({ reason: "multiple-tables" }));
  it("blocks when no table or too few columns", () => {
    expect(assessAnalysis({ ...contactsTable(), tableDetected: false }).reason).toBe("no-table");
    expect(assessAnalysis(analysis([col("Only", "text", "primary")])).reason).toBe("no-table");
  });
});

describe("columnConfidenceLevel", () => {
  it("distinguishes detected, partial, uncertain and missing", () => {
    expect(columnConfidenceLevel({ name: "A", sampleValues: ["x"], confidence: 0.9 })).toBe("detected");
    expect(columnConfidenceLevel({ name: "A", sampleValues: ["x"], confidence: 0.6 })).toBe("partial");
    expect(columnConfidenceLevel({ name: "A", sampleValues: ["x"], confidence: 0.2 })).toBe("uncertain");
    expect(columnConfidenceLevel({ name: "", sampleValues: [], confidence: 0.9 })).toBe("missing");
  });
});
