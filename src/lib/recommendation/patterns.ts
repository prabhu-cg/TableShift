import type { Complexity, Criterion, PatternId } from "@/types/recommendation";

export interface PatternDefinition {
  id: PatternId;
  name: string;
  complexity: Complexity;
  /** Max fields shown in the primary (collapsed / list / card) view. `Infinity` = all, via scrolling. */
  visibleBudget: number;
  /** Base criterion scores (0–100) before rules are applied. */
  base: Record<Criterion, number>;
  advantages: string[];
  limitations: string[];
  interactionNotes: string[];
  accessibilityNotes: string[];
}

export const PATTERNS: Record<PatternId, PatternDefinition> = {
  card: {
    id: "card",
    name: "Card-based layout",
    complexity: "low",
    visibleBudget: 4,
    base: {
      informationPreservation: 70,
      mobileReadability: 85,
      dataRelationships: 50,
      interactionSimplicity: 80,
      accessibility: 80,
      implementationComplexity: 85,
    },
    advantages: ["Removes horizontal scrolling entirely.", "Each record reads as one self-contained unit."],
    limitations: ["Increases vertical page length.", "Comparing the same field across records is harder."],
    interactionNotes: ["Tapping a card can open the record or reveal its actions."],
    accessibilityNotes: [
      "Use a list with one item per card so screen readers announce the record count.",
      "Keep a consistent label-value order across cards.",
    ],
  },
  "expandable-rows": {
    id: "expandable-rows",
    name: "Expandable rows",
    complexity: "medium",
    visibleBudget: 3,
    base: {
      informationPreservation: 75,
      mobileReadability: 75,
      dataRelationships: 55,
      interactionSimplicity: 60,
      accessibility: 65,
      implementationComplexity: 60,
    },
    advantages: ["Keeps a compact scannable list.", "Secondary details are available in place without leaving the page."],
    limitations: ["Adds a tap for every secondary detail.", "Several expanded rows make the page long and uneven."],
    interactionNotes: ["Show a clear expand/collapse affordance on every row.", "Keep the key action reachable from the collapsed row."],
    accessibilityNotes: [
      "Use a disclosure button with aria-expanded for each row.",
      "Move no focus on expand; announce state changes via aria-expanded.",
    ],
  },
  "horizontal-scroll": {
    id: "horizontal-scroll",
    name: "Horizontal scrolling table",
    complexity: "low",
    visibleBudget: Infinity,
    base: {
      informationPreservation: 95,
      mobileReadability: 40,
      dataRelationships: 90,
      interactionSimplicity: 55,
      accessibility: 55,
      implementationComplexity: 90,
    },
    advantages: ["Preserves the full table structure and every column.", "Keeps values aligned for direct comparison."],
    limitations: ["Needs horizontal scrolling, so columns off-screen are easy to miss.", "Row context is lost when the first column scrolls away."],
    interactionNotes: ["Pin the first column so each row stays identifiable.", "Show an edge fade or partial column to signal more content."],
    accessibilityNotes: [
      "Make the scroll region keyboard-focusable and labelled.",
      "Keep real table semantics (th/td) so screen readers can navigate cells.",
    ],
  },
  "prioritised-columns": {
    id: "prioritised-columns",
    name: "Prioritised columns",
    complexity: "medium",
    visibleBudget: 3,
    base: {
      informationPreservation: 60,
      mobileReadability: 80,
      dataRelationships: 60,
      interactionSimplicity: 80,
      accessibility: 80,
      implementationComplexity: 70,
    },
    advantages: ["Keeps the most important columns visible at a glance.", "Retains a familiar table structure."],
    limitations: ["Secondary columns need a separate way to be reached.", "Depends on a correct choice of which columns matter most."],
    interactionNotes: ["Offer a “show all columns” toggle or column picker for secondary fields."],
    accessibilityNotes: [
      "Hidden columns must be removed from the accessibility tree, not just visually hidden.",
      "Announce when the visible column set changes.",
    ],
  },
  "list-detail": {
    id: "list-detail",
    name: "List-detail layout",
    complexity: "high",
    visibleBudget: 3,
    base: {
      informationPreservation: 85,
      mobileReadability: 80,
      dataRelationships: 60,
      interactionSimplicity: 50,
      accessibility: 75,
      implementationComplexity: 40,
    },
    advantages: ["Lowest initial density: a simple list of records.", "A dedicated detail view has room for every field and action."],
    limitations: ["Requires navigating between list and detail.", "Highest implementation effort (routing, state, back behaviour)."],
    interactionNotes: ["Preserve list scroll position and filters when returning from a record."],
    accessibilityNotes: [
      "Move focus to the detail heading on open and back to the list item on return.",
      "Give the detail view its own URL so the browser back button works.",
    ],
  },
  "column-picker": {
    id: "column-picker",
    name: "Column picker",
    complexity: "medium",
    visibleBudget: 4,
    base: {
      informationPreservation: 75,
      mobileReadability: 65,
      dataRelationships: 75,
      interactionSimplicity: 55,
      accessibility: 60,
      implementationComplexity: 50,
    },
    advantages: ["Users choose the columns that matter to their task.", "Keeps a real table, so values stay aligned for comparison."],
    limitations: ["Needs a good default set of columns.", "Every column change is an extra interaction."],
    interactionNotes: ["Start with the most important columns and remember the user's choice.", "Show how many columns are selected on the picker button."],
    accessibilityNotes: [
      "Use a labelled group of checkboxes inside the picker.",
      "Announce when the column set changes and keep focus on the picker button.",
    ],
  },
  "grouped-sections": {
    id: "grouped-sections",
    name: "Grouped sections",
    complexity: "medium",
    visibleBudget: 3,
    base: {
      informationPreservation: 80,
      mobileReadability: 70,
      dataRelationships: 65,
      interactionSimplicity: 65,
      accessibility: 70,
      implementationComplexity: 55,
    },
    advantages: ["Records are organised under headers users already think in.", "Collapsing a section skips whole groups of rows."],
    limitations: ["Only works when one column has a few repeated values.", "Comparing records in different sections takes extra scrolling."],
    interactionNotes: ["Show the record count in each section header.", "Open the first section by default."],
    accessibilityNotes: [
      "Use a disclosure button with aria-expanded for each section header.",
      "Make the section header a heading so users can jump between sections.",
    ],
  },
  "tabbed-groups": {
    id: "tabbed-groups",
    name: "Tabbed column groups",
    complexity: "medium",
    visibleBudget: 3,
    base: {
      informationPreservation: 85,
      mobileReadability: 75,
      dataRelationships: 70,
      interactionSimplicity: 60,
      accessibility: 70,
      implementationComplexity: 55,
    },
    advantages: ["Mirrors the column groups the desktop table already has.", "Each tab keeps a small, readable set of columns."],
    limitations: ["Columns in different groups can't be seen together.", "Needs the table to have clear column groups."],
    interactionNotes: ["Keep the record title visible on every tab.", "Remember the selected tab while the user scrolls the list."],
    accessibilityNotes: [
      "Use a tablist with roving tabindex and arrow-key navigation.",
      "Associate each panel with its tab using aria-controls and aria-labelledby.",
    ],
  },
  "summary-sheet": {
    id: "summary-sheet",
    name: "Summary + bottom sheet",
    complexity: "medium",
    visibleBudget: 3,
    base: {
      informationPreservation: 85,
      mobileReadability: 78,
      dataRelationships: 60,
      interactionSimplicity: 65,
      accessibility: 60,
      implementationComplexity: 45,
    },
    advantages: ["The list stays light, and the full record opens without leaving the page.", "A sheet has room for every field, nested content and actions."],
    limitations: ["Every detail needs a tap and a sheet to dismiss.", "Needs careful focus handling because the sheet covers the list."],
    interactionNotes: ["Open the sheet from the whole row, not just a small icon.", "Close it with a button, the Escape key and a tap on the dimmed list."],
    accessibilityNotes: [
      "Treat the sheet as a modal dialog: move focus into it on open and back to the row on close.",
      "Hide the list from assistive technology while the sheet is open.",
    ],
  },
  "record-pager": {
    id: "record-pager",
    name: "One record at a time",
    complexity: "low",
    visibleBudget: Infinity,
    base: {
      informationPreservation: 90,
      mobileReadability: 80,
      dataRelationships: 55,
      interactionSimplicity: 45,
      accessibility: 70,
      implementationComplexity: 60,
    },
    advantages: ["Every field of one record is readable at full width.", "Works for very wide tables without hiding any column."],
    limitations: ["Comparing records means paging back and forth.", "Slow for long lists."],
    interactionNotes: ["Offer Previous and Next buttons, and a way to jump to a record.", "Show the position, such as Record 3 of 12."],
    accessibilityNotes: [
      "Use real buttons for Previous and Next, and disable them at the ends.",
      "Announce the new record's title and position after each change.",
    ],
  },
};
