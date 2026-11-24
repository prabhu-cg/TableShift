import { describe, expect, it } from "vitest";
import type { TableAnalysis } from "@/types/analysis";
import { UNREADABLE } from "@/types/analysis";
import { recommend } from "../recommendation/engine";
import { analysis, col, contactsTable, financialTable, wideAdminTable } from "../test-fixtures";
import { clampFullWidth, clampViewport, fitScale } from "./viewport";
import { actionLabel, buildPreviewModel, groupFields, statusTone } from "./model";

const withRows = (a: TableAnalysis, rows: Record<string, string>[]): TableAnalysis => ({
  ...a,
  rows: rows.map((values, i) => ({ id: `row-${i + 1}`, values })),
});

describe("buildPreviewModel", () => {
  it("never drops a column, for every pattern and every fixture", () => {
    for (const a of [financialTable(), contactsTable(), wideAdminTable()]) {
      const dataIds = a.columns.filter((c) => c.dataType !== "action").map((c) => c.id).sort();
      for (const r of recommend(a).recommendations) {
        const m = buildPreviewModel(a, r);
        expect([...m.visible, ...m.secondary].map((c) => c.id).sort()).toEqual(dataIds);
        expect(m.columns).toHaveLength(dataIds.length);
      }
    }
  });

  it("maps duplicate labels to distinct columns", () => {
    const dup = col("Status", "status", "secondary");
    const a = analysis([
      col("Name", "text", "primary"),
      { ...dup, id: "status-1" },
      { ...dup, id: "status-2" },
      col("Notes", "text", "optional"),
      col("More", "text", "optional"),
    ]);
    const m = buildPreviewModel(a, recommend(a).recommendations[0]);
    const ids = [...m.visible, ...m.secondary].map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("uses only extracted values and marks missing and unreadable cells explicitly", () => {
    const a = withRows(contactsTable(), [{ "c-Name": "Ana", "c-Role": UNREADABLE }]);
    const m = buildPreviewModel(a, recommend(a).recommendations[0]);
    const row = m.rows[0];
    expect(row.cells["c-Name"]).toEqual({ state: "value", text: "Ana" });
    expect(row.cells["c-Role"].state).toBe("unreadable");
    expect(row.cells["c-Status"]).toEqual({ state: "missing", text: "—" });
  });

  it("falls back to 'Record N' only when no identifier is readable", () => {
    const a = withRows(contactsTable(), [{ "c-Name": "Ana" }, {}]);
    const m = buildPreviewModel(a, recommend(a).recommendations[0]);
    expect(m.rows[0]).toMatchObject({ title: "Ana", titleIsFallback: false });
    expect(m.rows[1]).toMatchObject({ title: "Record 2", titleIsFallback: true });
  });

  it("reports empty states", () => {
    expect(buildPreviewModel(analysis([]), null).empty).toBe("no-columns");
    expect(buildPreviewModel({ ...contactsTable(), rows: [] }, null).empty).toBe("no-rows");
    expect(buildPreviewModel(withRows(contactsTable(), [{ "c-Name": "A" }]), null).empty).toBeNull();
  });

  it("flags low-confidence columns", () => {
    const a = analysis([col("A", "text", "primary", ["x"], 0.9), col("B", "text", "secondary", ["x"], 0.4)]);
    const m = buildPreviewModel(a, null);
    expect(m.columns.map((c) => c.uncertain)).toEqual([false, true]);
    expect(m.hasLowConfidence).toBe(true);
  });

  it("handles missing recommendation and action-type columns", () => {
    const a = analysis([col("A", "text", "primary"), col("Do", "action", "optional"), col("B", "text", "secondary")]);
    const m = buildPreviewModel(a, undefined);
    expect(m.columns.map((c) => c.label)).toEqual(["A", "B"]);
    expect(m.titleColumn?.label).toBe("A");
  });

  it("is deterministic", () => {
    const a = withRows(financialTable(), [{ "c-Invoice": "INV-1" }]);
    const r = recommend(a).recommendations[0];
    expect(buildPreviewModel(a, r)).toEqual(buildPreviewModel(structuredClone(a), structuredClone(r)));
  });
});

describe("helpers", () => {
  it("groups fields by kind", () => {
    const a = financialTable();
    const m = buildPreviewModel(a, null);
    const groups = groupFields(m.columns);
    expect(groups.map((g) => g.key)).toEqual(["details", "amounts", "dates"]);
  });

  it("derives a restrained status tone only from known words", () => {
    expect(statusTone("Paid")).toBe("ok");
    expect(statusTone("Pending review")).toBe("warn");
    expect(statusTone("Overdue")).toBe("bad");
    expect(statusTone("Qualified lead")).toBe("neutral");
  });

  it("labels actions without inventing wording", () => {
    expect(actionLabel({ label: "Edit", type: "button" })).toBe("Edit");
    expect(actionLabel({ label: "", type: "menu" })).toBe("More actions");
    expect(actionLabel({ label: " ", type: "link" })).toBe("Action");
  });
});

describe("viewport", () => {
  it("clamps and validates widths", () => {
    expect(clampViewport(100)).toBe(280);
    expect(clampViewport(9999)).toBe(600);
    expect(clampViewport(Number.NaN)).toBe(390);
    expect(clampViewport(375.4)).toBe(375);
    expect(clampFullWidth(5000)).toBe(1024);
  });
  it("only ever scales down", () => {
    expect(fitScale(1000, 400)).toBe(1);
    expect(fitScale(200, 400)).toBe(0.5);
    expect(fitScale(10, 400)).toBe(0.3);
    expect(fitScale(0, 400)).toBe(1);
  });
});
