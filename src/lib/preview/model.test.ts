import { describe, expect, it } from "vitest";
import type { TableAnalysis } from "@/types/analysis";
import { UNREADABLE } from "@/types/analysis";
import { recommend } from "../recommendation/engine";
import { analysis, appointmentsTable, col, contactsTable, financialTable, wideAdminTable } from "../test-fixtures";
import { deriveFeatures } from "../features";
import { clampFullWidth, clampViewport, deviceHeightFor, deviceName, fitScale } from "./viewport";
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

  it("titles a record by its name rather than its ID, and still shows the ID as a field", () => {
    const a = appointmentsTable();
    const m = buildPreviewModel(a, recommend(a).recommendations[0]);
    expect(m.titleColumn?.label).toBe("Patient Name");
    expect(m.columns.map((c) => c.label)).toContain("Patient ID");
    expect(m.columns.find((c) => c.label === "Mobile Number")?.identifierLike).toBe(true);
  });

  it("falls back to an identifier title when no other primary column exists", () => {
    const a = analysis([col("Order ID", "text", "primary"), col("Total", "currency", "secondary")]);
    expect(buildPreviewModel(a, null).titleColumn?.label).toBe("Order ID");
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
    expect(statusTone("Accepted")).toBe("ok");
    expect(statusTone("Rescheduled")).toBe("warn");
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
  it("keeps a realistic device shape at every width", () => {
    for (const w of [280, 320, 360, 375, 390, 430]) {
      const ratio = deviceHeightFor(w) / w;
      expect(ratio).toBeGreaterThan(1.7);
      expect(ratio).toBeLessThan(1.8);
    }
    expect(deviceHeightFor(390)).toBe(683);
    // wider screens ease toward tablet proportions but stay taller than wide
    expect(deviceHeightFor(600)).toBeGreaterThan(600);
    expect(deviceHeightFor(600) / 600).toBeLessThan(deviceHeightFor(430) / 430);
    // taller as the width grows, so the device never gets squashed
    expect(deviceHeightFor(430)).toBeGreaterThan(deviceHeightFor(390));
  });
  it("names the preset devices", () => {
    expect(deviceName(390)).toBe("iPhone 14");
    expect(deviceName(333)).toBe("Custom width");
    expect(deviceName(500)).toBe("Large phone / small tablet");
  });
  it("only ever scales down", () => {
    expect(fitScale(1000, 400)).toBe(1);
    expect(fitScale(200, 400)).toBe(0.5);
    expect(fitScale(10, 400)).toBe(0.3);
    expect(fitScale(0, 400)).toBe(1);
  });
});

describe("column groups and row details", () => {
  const base = analysis([
    col("Fund", "text", "primary"),
    { ...col("YTD", "number", "secondary"), group: "Performance %" },
    { ...col("1Y", "number", "secondary"), group: "Performance %" },
  ]);
  const grouped: TableAnalysis = {
    ...base,
    rows: [
      {
        id: "r1",
        values: { "c-Fund": "Alpha", "c-YTD": "1.2", "c-1Y": "3.4" },
        details: [{ heading: "Documents", items: ["Factsheet"] }],
      },
    ],
    features: { ...base.features, hasColumnGroups: true, hasRowDetails: true },
  };

  it("keeps the group in the label and the bare name separately", () => {
    const m = buildPreviewModel(grouped, null);
    expect(m.columns.map((c) => c.label)).toEqual(["Fund", "Performance % · YTD", "Performance % · 1Y"]);
    expect(m.columns[1].name).toBe("YTD");
    expect(m.columns[1].group).toBe("Performance %");
  });

  it("carries row details through", () => {
    const m = buildPreviewModel(grouped, null);
    expect(m.rows[0].details[0].items).toEqual(["Factsheet"]);
  });

  it("derives the group and detail feature flags", () => {
    const derived = deriveFeatures(grouped.columns, grouped.rows, []);
    expect(derived.hasColumnGroups).toBe(true);
    expect(derived.hasRowDetails).toBe(true);
    expect(deriveFeatures(base.columns, base.rows, []).hasColumnGroups).toBe(true);
    expect(deriveFeatures(contactsTable().columns, [], []).hasRowDetails).toBe(false);
  });
});
