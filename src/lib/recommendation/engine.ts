import type { TableAnalysis } from "@/types/analysis";
import {
  CRITERIA,
  type Criterion,
  type PatternId,
  type Recommendation,
  type RecommendationSet,
  type RuleNote,
} from "@/types/recommendation";
import { columnLabel, dataColumns } from "../features";
import { CRITERION_LABELS, CRITERION_WEIGHTS, PATTERN_ORDER } from "./constants";
import { PATTERNS, type PatternDefinition } from "./patterns";
import { ADJUSTMENT_RULES, CONSTRAINT_RULES, buildContext, type RuleContext } from "./rules";

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const unique = (xs: string[]) => [...new Set(xs)];

interface Scored {
  def: PatternDefinition;
  breakdown: Record<Criterion, number>;
  notes: RuleNote[];
  uncapped: number;
  score: number;
}

function scorePattern(def: PatternDefinition, ctx: RuleContext): Scored {
  const breakdown = { ...def.base };
  const notes: RuleNote[] = [];

  for (const rule of ADJUSTMENT_RULES) {
    if (rule.pattern !== def.id || !rule.when(ctx)) continue;
    breakdown[rule.criterion] += rule.delta;
    notes.push({ kind: "adjustment", criterion: rule.criterion, delta: rule.delta, text: rule.text });
  }
  for (const c of CRITERIA) breakdown[c] = clamp(breakdown[c]);

  const weighted = CRITERIA.reduce((sum, c) => sum + breakdown[c] * CRITERION_WEIGHTS[c], 0);
  const uncapped = Math.round(weighted);

  let score = uncapped;
  for (const rule of CONSTRAINT_RULES) {
    if (rule.pattern !== def.id || !rule.when(ctx)) continue;
    notes.push({ kind: "constraint", cap: rule.cap, text: rule.text });
    score = Math.min(score, rule.cap);
  }
  return { def, breakdown, notes, uncapped, score };
}

/** Which fields appear in the primary view vs. a secondary place (expansion, detail, scroll, toggle). */
function partitionFields(def: PatternDefinition, analysis: TableAnalysis) {
  const cols = dataColumns(analysis.columns).map((c) => ({
    label: columnLabel(c, analysis.columns.indexOf(c)),
    importance: c.importance,
    isStatus: c.dataType === "status",
  }));

  if (def.id === "horizontal-scroll") {
    // Everything is present; only the first screenful is visible without scrolling.
    const n = Math.min(cols.length, 3);
    return { visible: cols.slice(0, n).map((c) => c.label), secondary: cols.slice(n).map((c) => c.label) };
  }
  const order = (imp: string) => (imp === "primary" ? 0 : imp === "secondary" ? 1 : 2);
  const ranked = cols
    .map((c, i) => ({ ...c, i }))
    // Within the same importance, status badges come first: they are the most scannable field.
    .sort((a, b) => order(a.importance) - order(b.importance) || Number(b.isStatus) - Number(a.isStatus) || a.i - b.i);
  const budget = Number.isFinite(def.visibleBudget) ? def.visibleBudget : ranked.length;
  const visibleSet = new Set(ranked.slice(0, budget).map((c) => c.i));
  return {
    visible: cols.filter((_, i) => visibleSet.has(i)).map((c) => c.label),
    secondary: cols.filter((_, i) => !visibleSet.has(i)).map((c) => c.label),
  };
}

function extraNotes(def: PatternDefinition, ctx: RuleContext) {
  const interaction: string[] = [];
  const accessibility: string[] = [];
  if (ctx.f.hasActions) {
    if (def.id === "card") interaction.push("Place row actions in a card footer or overflow menu.");
    if (def.id === "expandable-rows") interaction.push("Keep the most-used action visible on the collapsed row.");
    if (def.id === "horizontal-scroll") interaction.push("Consider a sticky actions column or per-row overflow menu.");
    if (def.id === "prioritised-columns") interaction.push("Put row actions in an overflow menu to save width.");
    if (def.id === "list-detail") interaction.push("Place row actions in the detail view header.");
  }
  if (ctx.f.hasStatusIndicators)
    accessibility.push("Don't rely on colour alone for status; include a text label.");
  return { interaction, accessibility };
}

function buildRationale(s: Scored, rank: number): string {
  const positives = s.notes.filter((n) => n.kind === "adjustment" && (n.delta ?? 0) > 0);
  const negatives = s.notes.filter((n) => n.kind === "adjustment" && (n.delta ?? 0) < 0);
  const lead = `${s.def.name} ranks #${rank} with ${s.score}/100.`;
  const why = positives.length
    ? ` Why it fits: ${positives
        .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
        .slice(0, 2)
        .map((n) => n.text.replace(/\.$/, ""))
        .join("; ")}.`
    : " It scores well on general mobile suitability for this table.";
  const constraint = s.notes.find((n) => n.kind === "constraint");
  const tradeoff = constraint
    ? ` Trade-off: ${constraint.text.replace(/^Hard constraint: /, "").replace(/\.$/, "")}.`
    : negatives.length
      ? ` Trade-off: ${negatives
          .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))[0]
          .text.replace(/\.$/, "")}.`
      : "";
  return lead + why + tradeoff;
}

/**
 * Deterministic recommendation engine. Same analysis in → same recommendations out.
 * AI output only supplies the analysis; it never supplies scores or rankings.
 */
export function recommend(analysis: TableAnalysis): RecommendationSet {
  const ctx = buildContext(analysis);

  const scored = PATTERN_ORDER.map((id) => scorePattern(PATTERNS[id], ctx)).sort(
    (a, b) =>
      b.score - a.score ||
      b.uncapped - a.uncapped ||
      PATTERN_ORDER.indexOf(a.def.id) - PATTERN_ORDER.indexOf(b.def.id),
  );
  const top = scored.slice(0, 3);

  const recommendations: Recommendation[] = top.map((s, i) => {
    const rank = i + 1;
    const fields = partitionFields(s.def, analysis);
    const extra = extraNotes(s.def, ctx);
    const gains = s.notes.filter((n) => n.kind === "adjustment" && (n.delta ?? 0) > 0).map((n) => n.text);
    const losses = s.notes.filter((n) => n.kind === "adjustment" && (n.delta ?? 0) < 0).map((n) => n.text);
    const constraints = s.notes.filter((n) => n.kind === "constraint").map((n) => n.text);
    return {
      id: s.def.id,
      pattern: s.def.name,
      patternId: s.def.id,
      score: s.score,
      rank,
      rationale: buildRationale(s, rank),
      advantages: unique([...gains.slice(0, 2), ...s.def.advantages]).slice(0, 4),
      limitations: unique([...constraints, ...losses.slice(0, 2), ...s.def.limitations]).slice(0, 4),
      visibleFields: fields.visible,
      secondaryFields: fields.secondary,
      interactionNotes: [...s.def.interactionNotes, ...extra.interaction],
      accessibilityNotes: [...s.def.accessibilityNotes, ...extra.accessibility],
      implementationComplexity: s.def.complexity,
      scoreBreakdown: Object.fromEntries(CRITERIA.map((c) => [c, Math.round(s.breakdown[c])])),
      ruleNotes: s.notes,
      uncappedScore: s.uncapped,
    };
  });

  return {
    recommendations,
    evaluated: scored.map((s, i) => ({
      patternId: s.def.id as PatternId,
      pattern: s.def.name,
      score: s.score,
      selected: i < 3,
    })),
  };
}

export { CRITERION_LABELS };
