import { describe, expect, it } from "vitest";
import { CRITERIA } from "@/types/recommendation";
import { analysis, appointmentsTable, col, contactsTable, financialTable, wideAdminTable } from "../test-fixtures";
import { CRITERION_WEIGHTS } from "./constants";
import { recommend } from "./engine";
import type { TableAnalysis } from "@/types/analysis";
import { deriveFeatures } from "../features";

const ids = (a: ReturnType<typeof analysis>) => recommend(a).recommendations.map((r) => r.patternId);

describe("recommend", () => {
  it("is deterministic", () => {
    const a = financialTable();
    expect(recommend(a)).toEqual(recommend(structuredClone(a)));
  });

  it("returns three ranked recommendations out of eight evaluated patterns", () => {
    const set = recommend(wideAdminTable());
    expect(set.recommendations.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(set.evaluated).toHaveLength(8);
    expect(set.evaluated.filter((e) => e.selected)).toHaveLength(3);
    const scores = set.recommendations.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("does not always return the same three patterns", () => {
    const sets = [financialTable(), contactsTable(), wideAdminTable()].map((a) => ids(a).join(","));
    expect(new Set(sets).size).toBeGreaterThanOrEqual(2);
  });

  it("ranks the horizontal table first for comparable financial data and caps cards", () => {
    const set = recommend(financialTable());
    expect(set.recommendations[0].patternId).toBe("horizontal-scroll");
    const card = set.evaluated.find((e) => e.patternId === "card")!;
    expect(card.score).toBeLessThanOrEqual(60);
  });

  it("keeps the horizontal table on top for a 7-column table that needs numeric comparison", () => {
    const a = analysis([
      col("Invoice", "text", "primary"),
      col("Client", "text", "primary"),
      col("Net", "currency", "secondary"),
      col("Tax", "currency", "secondary"),
      col("Total", "currency", "primary"),
      col("Due", "date", "secondary"),
      col("Ref", "text", "optional"),
    ]);
    const set = recommend(a);
    expect(set.recommendations[0].patternId).toBe("horizontal-scroll");
    // one critical column (Total) sits beyond the first screenful, so the cap of 80 is recorded
    expect(set.recommendations[0].ruleNotes.some((n) => n.kind === "constraint")).toBe(true);
  });

  it("drops horizontal scrolling when many critical columns would be hidden", () => {
    const cols = Array.from({ length: 9 }, (_, i) => col(`Metric ${i + 1}`, "currency", "primary"));
    const hor = recommend(analysis(cols)).evaluated.find((e) => e.patternId === "horizontal-scroll")!;
    expect(hor.score).toBeLessThanOrEqual(65);
  });

  it("penalises horizontal scrolling for wide tables with long text", () => {
    const set = recommend(wideAdminTable());
    const hor = set.evaluated.find((e) => e.patternId === "horizontal-scroll")!;
    expect(hor.selected).toBe(false);
    expect(set.recommendations[0].patternId).not.toBe("horizontal-scroll");
  });

  it("favours cards for small independent-record tables", () => {
    expect(recommend(contactsTable()).recommendations[0].patternId).toBe("card");
  });

  it("score equals the weighted breakdown unless a hard constraint capped it", () => {
    for (const a of [financialTable(), contactsTable(), wideAdminTable()]) {
      for (const r of recommend(a).recommendations) {
        const weighted = Math.round(
          CRITERIA.reduce((s, c) => s + r.scoreBreakdown[c] * CRITERION_WEIGHTS[c], 0),
        );
        expect(Math.abs(weighted - r.uncappedScore)).toBeLessThanOrEqual(1); // rounding of breakdown
        expect(r.score).toBeLessThanOrEqual(r.uncappedScore);
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("caps expandable rows when four or more columns are critical", () => {
    const a = analysis([
      col("A", "text", "primary"),
      col("B", "text", "primary"),
      col("C", "text", "primary"),
      col("D", "text", "primary"),
      col("E", "text", "optional"),
    ]);
    const exp = recommend(a).evaluated.find((e) => e.patternId === "expandable-rows")!;
    expect(exp.score).toBeLessThanOrEqual(62);
  });

  it("changes recommendations when the user corrects a data type", () => {
    const before = analysis([
      col("Name", "text", "primary"),
      col("Q1", "text", "secondary"),
      col("Q2", "text", "secondary"),
      col("Q3", "text", "secondary"),
    ]);
    const after = analysis(before.columns.map((c) => (c.name.startsWith("Q") ? { ...c, dataType: "number" as const } : c)));
    expect(after.features.requiresCrossColumnComparison).toBe(true);
    const cardBefore = recommend(before).evaluated.find((e) => e.patternId === "card")!.score;
    const cardAfter = recommend(after).evaluated.find((e) => e.patternId === "card")!.score;
    expect(cardAfter).toBeLessThan(cardBefore);
  });

  it("separates visible and secondary fields and excludes action columns", () => {
    const a = analysis([
      col("Name", "text", "primary"),
      col("Email", "text", "secondary"),
      col("Plan", "text", "secondary"),
      col("Seats", "number", "optional"),
      col("Region", "text", "optional"),
      col("", "action", "optional"),
    ]);
    for (const r of recommend(a).recommendations) {
      const all = [...r.visibleFields, ...r.secondaryFields];
      expect(all.sort()).toEqual(["Email", "Name", "Plan", "Region", "Seats"]);
      expect(r.visibleFields).toContain("Name");
    }
  });

  it("keeps the status badge up front ahead of plain secondary text columns", () => {
    const set = recommend(appointmentsTable());
    for (const r of set.recommendations) {
      if (r.patternId === "horizontal-scroll") continue;
      expect(r.visibleFields).toContain("Status");
    }
  });

  it("does not treat IDs and phone numbers typed as numbers as comparable measures", () => {
    const a = analysis([
      col("Patient ID", "number", "primary", ["1234"]),
      col("Mobile Number", "number", "secondary", ["+447123456789"]),
      col("Name", "text", "primary"),
      col("Status", "status", "secondary"),
    ]);
    expect(a.features.hasComparableValues).toBe(false);
    expect(a.features.requiresCrossColumnComparison).toBe(false);
    const measures = analysis([col("Qty", "number", "primary", ["3"]), col("Price", "currency", "secondary", ["$4"])]);
    expect(measures.features.hasComparableValues).toBe(true);
  });

  it("returns the remaining five patterns as ranked lower-fit options", () => {
    const set = recommend(appointmentsTable());
    expect(set.recommendations).toHaveLength(3);
    expect(set.others).toHaveLength(5);
    expect(set.others.map((o) => o.rank)).toEqual([4, 5, 6, 7, 8]);
    const ids = [...set.recommendations, ...set.others].map((r) => r.patternId);
    expect(new Set(ids).size).toBe(8);
    expect(set.others[0].score).toBeGreaterThanOrEqual(set.others[1].score);
  });

  describe("new patterns", () => {
    const find = (a: TableAnalysis, id: string) => {
      const set = recommend(a);
      return [...set.recommendations, ...set.others].find((r) => r.patternId === id)!;
    };
    const withValues = (a: TableAnalysis, key: string, values: string[]): TableAnalysis => {
      const c = a.columns.find((x) => x.name === key)!;
      return { ...a, rows: a.rows.map((r, i) => ({ ...r, values: { ...r.values, [c.id]: values[i % values.length] } })) };
    };

    it("caps grouped sections unless a column splits the rows into a few sections", () => {
      const plain = find(appointmentsTable(), "grouped-sections");
      expect(plain.score).toBeLessThanOrEqual(45);
      expect(plain.ruleNotes.some((n) => n.kind === "constraint")).toBe(true);

      const withStatus = withValues(appointmentsTable(), "Status", ["Accepted", "Pending", "Cancelled"]);
      const sectioned = find(withStatus, "grouped-sections");
      expect(sectioned.ruleNotes.some((n) => n.kind === "constraint")).toBe(false);
      expect(sectioned.score).toBeGreaterThan(plain.score);
    });

    it("caps tabbed groups unless the table has two or more column groups", () => {
      expect(find(wideAdminTable(), "tabbed-groups").score).toBeLessThanOrEqual(40);

      const base = wideAdminTable();
      const columns = base.columns.map((c, i) => ({ ...c, group: i < 3 ? "" : i < 6 ? "Contact" : "Billing" }));
      const grouped: TableAnalysis = { ...base, columns, features: deriveFeatures(columns, base.rows, base.actions) };
      const tabs = find(grouped, "tabbed-groups");
      expect(tabs.ruleNotes.some((n) => n.kind === "constraint")).toBe(false);
      expect(tabs.score).toBeGreaterThan(find(wideAdminTable(), "tabbed-groups").score);
    });

    it("caps the column picker for tables with four or fewer columns", () => {
      const small = analysis([col("A", "text", "primary"), col("B", "text", "secondary"), col("C", "number", "secondary")]);
      expect(find(small, "column-picker").score).toBeLessThanOrEqual(55);
    });

    it("keeps tab and section recommendations deterministic", () => {
      const a = withValues(appointmentsTable(), "Status", ["Accepted", "Pending", "Cancelled"]);
      expect(recommend(a)).toEqual(recommend(a));
    });
  });
});
