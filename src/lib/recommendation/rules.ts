import type { TableAnalysis } from "@/types/analysis";
import type { Criterion, PatternId } from "@/types/recommendation";
import { dataColumns } from "../features";
import { COLUMNS_VISIBLE_WITHOUT_SCROLL } from "./constants";

/** Facts every rule is evaluated against. All derived from the (possibly user-corrected) analysis. */
export interface RuleContext {
  n: number; // data columns
  primary: number;
  secondaryOptional: number;
  numeric: number; // number + currency columns
  rows: number;
  /** Primary columns positioned beyond the first screenful of columns. */
  hiddenCritical: number;
  f: TableAnalysis["features"];
}

export function buildContext(analysis: TableAnalysis): RuleContext {
  const cols = dataColumns(analysis.columns);
  return {
    n: cols.length,
    primary: cols.filter((c) => c.importance === "primary").length,
    secondaryOptional: cols.filter((c) => c.importance !== "primary").length,
    numeric: cols.filter((c) => c.dataType === "number" || c.dataType === "currency").length,
    rows: analysis.rows.length,
    hiddenCritical: cols.filter(
      (c, i) => c.importance === "primary" && i >= COLUMNS_VISIBLE_WITHOUT_SCROLL,
    ).length,
    f: analysis.features,
  };
}

export interface AdjustmentRule {
  id: string;
  pattern: PatternId;
  criterion: Criterion;
  delta: number;
  when: (c: RuleContext) => boolean;
  text: string;
}

export interface ConstraintRule {
  id: string;
  pattern: PatternId;
  cap: number;
  when: (c: RuleContext) => boolean;
  text: string;
}

const adj = (
  id: string,
  pattern: PatternId,
  criterion: Criterion,
  delta: number,
  when: AdjustmentRule["when"],
  text: string,
): AdjustmentRule => ({ id, pattern, criterion, delta, when, text });

const fewCols = (c: RuleContext) => c.n <= 3;
const manyCols = (c: RuleContext) => c.n >= 7;
// When values must be compared across columns, every alternative loses that comparison,
// so the generic "wide table" penalty is waived (hidden critical columns are still capped below).
const manyColsNoCompare = (c: RuleContext) => manyCols(c) && !c.f.requiresCrossColumnComparison;
const fewPrimary = (c: RuleContext) => c.primary <= 2 && c.n >= 5;
const manySecondary = (c: RuleContext) => c.secondaryOptional >= 3 && c.primary <= 3;
const compares = (c: RuleContext) => c.f.requiresCrossColumnComparison;
const comparesSome = (c: RuleContext) => c.f.hasComparableValues && !c.f.requiresCrossColumnComparison;

export const ADJUSTMENT_RULES: AdjustmentRule[] = [
  // Table width
  adj("few-cols-hor", "horizontal-scroll", "mobileReadability", +30, fewCols, "Only a few columns, so the table fits a phone screen with little or no scrolling."),
  adj("few-cols-pri", "prioritised-columns", "informationPreservation", +15, fewCols, "With few columns, little needs to be hidden."),
  adj("few-cols-exp", "expandable-rows", "interactionSimplicity", -15, fewCols, "Few columns leave little secondary content to justify an expand step."),
  adj("few-cols-ld", "list-detail", "interactionSimplicity", -15, fewCols, "Few columns don't justify a separate detail screen."),
  adj("many-cols-hor-read", "horizontal-scroll", "mobileReadability", -20, manyColsNoCompare, "Many columns require long horizontal scrolling on a phone."),
  adj("many-cols-hor-pres", "horizontal-scroll", "informationPreservation", -15, manyColsNoCompare, "With many columns, much of the table stays off-screen at any moment."),
  adj("very-many-cols-hor", "horizontal-scroll", "mobileReadability", -15, (c) => c.n >= 10, "Ten or more columns make horizontal scrolling very hard to follow."),
  adj("wide-hor-a11y", "horizontal-scroll", "accessibility", -10, (c) => c.n >= 6, "Wide tables need two-dimensional navigation, which is harder for keyboard and screen-reader users."),
  adj("many-cols-ld", "list-detail", "informationPreservation", +10, (c) => c.n >= 8 && c.primary <= 2, "Many fields can all live in the detail view while the list stays light."),

  // Column importance
  adj("few-primary-pri-pres", "prioritised-columns", "informationPreservation", +20, fewPrimary, "Only one or two columns carry most of the meaning, so they can stay visible."),
  adj("few-primary-pri-rel", "prioritised-columns", "dataRelationships", +10, fewPrimary, "The key columns remain side by side."),
  adj("many-primary-pri", "prioritised-columns", "informationPreservation", -25, (c) => c.primary >= 4, "Four or more columns are critical, too many to keep visible on a phone."),
  adj("secondary-exp-pres", "expandable-rows", "informationPreservation", +10, manySecondary, "Several secondary columns can be disclosed progressively."),
  adj("secondary-exp-rel", "expandable-rows", "dataRelationships", +5, manySecondary, "Secondary fields stay attached to their row when expanded."),
  adj("secondary-pri", "prioritised-columns", "informationPreservation", +10, manySecondary, "Secondary columns can be moved behind a toggle while key columns stay visible."),
  adj("complex-ld-rel", "list-detail", "dataRelationships", +10, (c) => c.n >= 6 && (c.f.hasLongText || c.secondaryOptional >= 3), "Complex records with many attributes suit a dedicated detail view."),
  adj("complex-ld-pres", "list-detail", "informationPreservation", +5, (c) => c.n >= 6 && (c.f.hasLongText || c.secondaryOptional >= 3), "A detail view can show every attribute of a complex record."),

  // Comparison and numeric data
  adj("compare-card", "card", "dataRelationships", -30, compares, "Users must compare several numeric values across records, which cards make hard."),
  adj("compare-exp", "expandable-rows", "dataRelationships", -20, compares, "Comparing numeric values across rows is awkward when details are collapsed."),
  adj("compare-ld", "list-detail", "dataRelationships", -15, compares, "Comparing records means navigating back and forth between detail views."),
  adj("compare-pri", "prioritised-columns", "dataRelationships", -10, compares, "Hidden numeric columns break cross-column comparison."),
  adj("compare-hor", "horizontal-scroll", "dataRelationships", +10, compares, "Keeps numeric columns aligned for direct comparison."),
  adj("some-compare-card", "card", "dataRelationships", -10, comparesSome, "Comparing numeric values across records is harder in cards."),
  adj("some-compare-hor", "horizontal-scroll", "dataRelationships", +5, comparesSome, "Numeric columns stay aligned for comparison."),
  adj("financial-hor-rel", "horizontal-scroll", "dataRelationships", +10, (c) => c.f.hasFinancialData, "Financial data is usually read across columns, which a table supports."),
  adj("financial-hor-pres", "horizontal-scroll", "informationPreservation", +5, (c) => c.f.hasFinancialData, "Financial figures keep their full context."),
  adj("financial-card", "card", "dataRelationships", -10, (c) => c.f.hasFinancialData, "Financial figures lose their column context in cards."),
  adj("independent-card", "card", "dataRelationships", +10, (c) => !c.f.hasComparableValues && c.n >= 3, "Records look independent, with no need to compare values across them."),

  // Text
  adj("text-card-rel", "card", "dataRelationships", +10, (c) => c.f.hasLongText, "Long descriptive text reads well in a card."),
  adj("text-card-read", "card", "mobileReadability", +10, (c) => c.f.hasLongText, "Cards give long text room to wrap."),
  adj("text-exp-read", "expandable-rows", "mobileReadability", +10, (c) => c.f.hasLongText, "Long text can sit in the expanded area instead of cramping the row."),
  adj("text-ld-read", "list-detail", "mobileReadability", +10, (c) => c.f.hasLongText, "A detail view gives long text full width."),
  adj("text-hor-read", "horizontal-scroll", "mobileReadability", -15, (c) => c.f.hasLongText, "Long text wraps poorly in narrow table cells."),
  adj("text-hor-a11y", "horizontal-scroll", "accessibility", -10, (c) => c.f.hasLongText, "Long text in a scrolling table is harder to read and zoom."),

  // Density and volume
  adj("dense-hor", "horizontal-scroll", "mobileReadability", -15, (c) => c.f.hasDenseContent, "Dense content is hard to read in a scrolling table."),
  adj("dense-ld", "list-detail", "mobileReadability", +10, (c) => c.f.hasDenseContent, "Dense content is split between a light list and a roomy detail view."),
  adj("dense-exp", "expandable-rows", "mobileReadability", +10, (c) => c.f.hasDenseContent, "Dense content is revealed only when wanted."),
  adj("dense-pri", "prioritised-columns", "informationPreservation", -10, (c) => c.f.hasDenseContent, "Dense tables lose more when columns are hidden."),
  adj("rows-card", "card", "mobileReadability", -10, (c) => c.rows >= 12, "Many rows turn cards into a very long page."),
  adj("rows-exp", "expandable-rows", "mobileReadability", +5, (c) => c.rows >= 12, "Compact collapsed rows keep long lists manageable."),
  adj("rows-ld", "list-detail", "mobileReadability", +5, (c) => c.rows >= 12, "A light list scales well to many rows."),
  adj("rows-hor", "horizontal-scroll", "mobileReadability", +5, (c) => c.rows >= 12, "Compact rows keep long lists scannable."),
  adj("small-card-pres", "card", "informationPreservation", +15, (c) => c.n <= 4 && !c.f.hasLongText && !compares(c), "All fields fit comfortably on one card."),
  adj("small-card-int", "card", "interactionSimplicity", +5, (c) => c.n <= 4 && !c.f.hasLongText && !compares(c), "Nothing needs hiding, so no extra taps."),

  // Actions and status
  adj("actions-card", "card", "interactionSimplicity", +5, (c) => c.f.hasActions, "Row actions fit naturally in a card footer."),
  adj("actions-exp", "expandable-rows", "interactionSimplicity", -10, (c) => c.f.hasActions, "Row actions risk being hidden behind the expand step."),
  adj("actions-hor", "horizontal-scroll", "interactionSimplicity", -10, (c) => c.f.hasActions && c.n >= 6, "The actions column is likely off-screen in a wide table."),
  adj("actions-ld", "list-detail", "interactionSimplicity", -5, (c) => c.f.hasActions, "Actions sit one navigation step away in the detail view."),
  adj("status-card", "card", "mobileReadability", +5, (c) => c.f.hasStatusIndicators, "Status badges stand out clearly on a card."),
  adj("status-pri", "prioritised-columns", "mobileReadability", +5, (c) => c.f.hasStatusIndicators, "Compact status indicators stay scannable in a narrow table."),
];

export const CONSTRAINT_RULES: ConstraintRule[] = [
  {
    id: "cap-card-compare",
    pattern: "card",
    cap: 60,
    when: compares,
    text: "Hard constraint: cards can't support comparing several numeric columns, so this pattern is capped at 60.",
  },
  {
    id: "cap-hor-hidden-2",
    pattern: "horizontal-scroll",
    cap: 65,
    when: (c) => c.hiddenCritical >= 2,
    text: "Hard constraint: two or more critical columns would sit off-screen, so this pattern is capped at 65.",
  },
  {
    id: "cap-hor-hidden-1",
    pattern: "horizontal-scroll",
    cap: 80,
    when: (c) => c.hiddenCritical === 1,
    text: "Hard constraint: a critical column would sit off-screen, so this pattern is capped at 80.",
  },
  {
    id: "cap-exp-primary",
    pattern: "expandable-rows",
    cap: 62,
    when: (c) => c.primary >= 4,
    text: "Hard constraint: four or more critical columns would sit behind an expand step, so this pattern is capped at 62.",
  },
  {
    id: "cap-pri-primary",
    pattern: "prioritised-columns",
    cap: 60,
    when: (c) => c.primary >= 5,
    text: "Hard constraint: five or more critical columns can't all stay visible, so this pattern is capped at 60.",
  },
  {
    id: "cap-ld-small",
    pattern: "list-detail",
    cap: 70,
    when: (c) => c.n <= 3,
    text: "Hard constraint: a detail screen adds navigation for very little content, so this pattern is capped at 70.",
  },
];
