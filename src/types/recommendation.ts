export type PatternId =
  | "card"
  | "expandable-rows"
  | "horizontal-scroll"
  | "prioritised-columns"
  | "list-detail";

export const CRITERIA = [
  "informationPreservation",
  "mobileReadability",
  "dataRelationships",
  "interactionSimplicity",
  "accessibility",
  "implementationComplexity",
] as const;
export type Criterion = (typeof CRITERIA)[number];

export type Complexity = "low" | "medium" | "high";

/** One explicit rule outcome that changed a criterion score or capped the total. */
export interface RuleNote {
  kind: "adjustment" | "constraint";
  criterion?: Criterion;
  delta?: number;
  /** For constraints: the maximum overall score applied. */
  cap?: number;
  text: string;
}

export interface Recommendation {
  id: string;
  pattern: string;
  patternId: PatternId;
  score: number;
  rank: number;
  rationale: string;
  advantages: string[];
  limitations: string[];
  visibleFields: string[];
  secondaryFields: string[];
  interactionNotes: string[];
  accessibilityNotes: string[];
  implementationComplexity: Complexity;
  /** Criterion → 0–100 score. Weighted by CRITERION_WEIGHTS to give `score`. */
  scoreBreakdown: Record<string, number>;
  /** Explicit rules that fired for this pattern (engine-applied, not AI). */
  ruleNotes: RuleNote[];
  /** Score before hard-constraint caps. */
  uncappedScore: number;
}

export interface RecommendationSet {
  recommendations: Recommendation[]; // top three, ranked
  /** All five candidates with scores, for transparency. */
  evaluated: { patternId: PatternId; pattern: string; score: number; selected: boolean }[];
}
