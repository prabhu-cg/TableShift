import { describe, expect, it } from "vitest";
import { columnGroups, findSectionColumn, UNGROUPED_LABEL } from "./features";
import { analysis, col } from "./test-fixtures";

const rowsOf = (key: string, values: string[], n = 12) =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i}`, values: { [key]: values[i % values.length] } }));

describe("columnGroups", () => {
  it("returns nothing for a table without groups", () => {
    expect(columnGroups(analysis([col("A", "text", "primary")]).columns)).toEqual([]);
  });

  it("collects columns under their group and puts the rest under General", () => {
    const cols = [
      col("Name", "text", "primary"),
      { ...col("YTD", "number", "secondary"), group: "Performance" },
      { ...col("1Y", "number", "secondary"), group: "Performance" },
      { ...col("Size", "currency", "secondary"), group: "Fund" },
    ];
    const groups = columnGroups(cols);
    expect(groups.map((g) => g.name)).toEqual([UNGROUPED_LABEL, "Performance", "Fund"]);
    expect(groups[1].columnIds).toHaveLength(2);
  });
});

describe("findSectionColumn", () => {
  const status = col("Status", "status", "secondary");
  it("picks a status column with a few repeated values", () => {
    const found = findSectionColumn([col("Name", "text", "primary"), status], rowsOf(status.id, ["Open", "Closed", "Pending"]));
    expect(found?.name).toBe("Status");
  });
  it("ignores identifiers, unique values and tables that are too short", () => {
    const id = col("Patient ID", "text", "primary");
    expect(findSectionColumn([id], rowsOf(id.id, ["#1", "#2", "#3"]))).toBeNull();
    const name = col("Name", "text", "primary");
    expect(findSectionColumn([name], Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, values: { [name.id]: `Person ${i}` } })))).toBeNull();
    expect(findSectionColumn([status], rowsOf(status.id, ["Open", "Closed"], 4))).toBeNull();
  });
});
