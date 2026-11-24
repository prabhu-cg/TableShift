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
};
