import type { Criterion, PatternId } from "@/types/recommendation";

/** Initial criterion weights (sum to 1). */
export const CRITERION_WEIGHTS: Record<Criterion, number> = {
  informationPreservation: 0.25,
  mobileReadability: 0.2,
  dataRelationships: 0.2,
  interactionSimplicity: 0.15,
  accessibility: 0.1,
  implementationComplexity: 0.1,
};

export const CRITERION_LABELS: Record<Criterion, string> = {
  informationPreservation: "Information preservation",
  mobileReadability: "Mobile readability",
  dataRelationships: "Data relationships",
  interactionSimplicity: "Interaction simplicity",
  accessibility: "Accessibility",
  implementationComplexity: "Implementation simplicity",
};

/** Fixed order, also the deterministic tie-break order. */
export const PATTERN_ORDER: PatternId[] = [
  "card",
  "prioritised-columns",
  "expandable-rows",
  "list-detail",
  "horizontal-scroll",
];

/** Columns that fit on a ~375px screen before horizontal scrolling. */
export const COLUMNS_VISIBLE_WITHOUT_SCROLL = 3;

/** Below this overall confidence, no recommendations are produced. */
export const MIN_CONFIDENCE = 0.5;
/** Below this, recommendations carry a caution. */
export const CAUTION_CONFIDENCE = 0.75;
