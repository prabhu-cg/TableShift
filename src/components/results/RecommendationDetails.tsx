"use client";

import { Check, Minus } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { TableAnalysis } from "@/types/analysis";
import type { Recommendation } from "@/types/recommendation";
import { CRITERIA } from "@/types/recommendation";
import { CRITERION_LABELS, CRITERION_WEIGHTS } from "@/lib/recommendation/constants";
import { PATTERN_GUIDANCE } from "@/lib/preview/pattern-guidance";
import { buildPreviewModel, groupFields } from "@/lib/preview/model";
import { SourceTag } from "@/components/ui/ConfidenceBadge";
import { Tabs } from "@/components/ui/Tabs";

const COMPLEXITY = { low: "Low", medium: "Medium", high: "High" } as const;

type Section = "why" | "fields" | "interaction" | "accessibility" | "build" | "score";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "why", label: "Why" },
  { id: "fields", label: "Fields" },
  { id: "interaction", label: "Interaction" },
  { id: "accessibility", label: "Accessibility" },
  { id: "build", label: "Build" },
  { id: "score", label: "Score" },
];

/** Everything about the selected layout, one short section at a time instead of one long scroll. */
export function RecommendationDetails({ rec, analysis }: { rec: Recommendation; analysis: TableAnalysis }) {
  const [section, setSection] = useState<Section>("why");
  const g = PATTERN_GUIDANCE[rec.patternId];
  const model = buildPreviewModel(analysis, rec);
  const grouped = rec.patternId === "horizontal-scroll" ? [] : groupFields(model.columns.filter((c) => c !== model.titleColumn));

  return (
    <div className="space-y-4">
      <Tabs
        variant="line"
        label={`Details for ${rec.pattern}`}
        idPrefix="detail"
        value={section}
        onChange={(v) => setSection(v as Section)}
        items={SECTIONS}
      />
      <div role="tabpanel" id={`detail-panel-${section}`} aria-labelledby={`detail-tab-${section}`} className="space-y-4">
        {section === "why" && (
          <>
            <p className="leading-relaxed text-text">{rec.rationale}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Bullets title="Advantages" items={rec.advantages} icon={<Check className="size-4 text-success" aria-hidden="true" />} />
              <Bullets title="Limitations" items={rec.limitations} icon={<Minus className="size-4 text-text-subtle" aria-hidden="true" />} />
            </div>
          </>
        )}

        {section === "fields" && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Identifier" value={model.titleColumn?.label ?? "None detected"} />
            <Row label="Up front" value={rec.visibleFields.join(", ") || "None"} />
            <Row
              label="Moved"
              value={
                rec.secondaryFields.length
                  ? `${rec.secondaryFields.join(", ")}: ${g.secondaryLocation.replace(/^./, (c) => c.toLowerCase())}`
                  : "Nothing moved: every field is visible."
              }
            />
            {grouped.length > 1 && (
              <Row label="Grouped" value={grouped.map((x) => `${x.label} (${x.columns.map((c) => c.label).join(", ")})`).join("; ")} />
            )}
          </dl>
        )}

        {section === "interaction" && (
          <>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Scrolling" value={g.interaction.scrolling} />
              <Row label="Expansion" value={g.interaction.expansion} />
              <Row label="Navigation" value={g.interaction.navigation} />
              <Row label="Selection" value={g.interaction.selection} />
            </dl>
            <p className="text-text-muted">
              <span className="font-medium text-text">Search and sorting</span> aren&rsquo;t shown. The screenshot doesn&rsquo;t define
              them, so the preview doesn&rsquo;t pretend to offer them.
            </p>
            {rec.interactionNotes.length > 0 && <Bullets title="Design notes" items={rec.interactionNotes} />}
          </>
        )}

        {section === "accessibility" && <Bullets items={[...new Set([...g.accessibility, ...rec.accessibilityNotes])]} />}

        {section === "build" && (
          <>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Complexity" value={COMPLEXITY[rec.implementationComplexity]} />
              <Row label="Responsive" value={g.implementation.responsive} />
            </dl>
            <div className="grid gap-5 sm:grid-cols-2">
              <Bullets title="CSS" items={g.implementation.css} />
              <Bullets title="Watch for" items={g.implementation.challenges} />
            </div>
          </>
        )}

        {section === "score" && (
          <>
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {CRITERIA.map((c) => (
                <li key={c}>
                  <div className="flex justify-between gap-3">
                    <span className="text-text">
                      {CRITERION_LABELS[c]} <span className="text-text-subtle">({Math.round(CRITERION_WEIGHTS[c] * 100)}%)</span>
                    </span>
                    <span className="tabular-nums text-text">{rec.scoreBreakdown[c]}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${rec.scoreBreakdown[c]}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            {rec.uncappedScore !== rec.score && (
              <p className="text-text-muted">Weighted score {rec.uncappedScore}, limited to {rec.score} by a hard constraint.</p>
            )}
            {rec.ruleNotes.length > 0 && (
              <ul className="space-y-2">
                {rec.ruleNotes.map((n, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <SourceTag kind="rules" />
                    <span className="min-w-0 flex-1 text-text-muted">
                      {n.kind === "adjustment" && (
                        <span className="mr-1 font-medium tabular-nums text-text">
                          {(n.delta ?? 0) > 0 ? "+" : ""}
                          {n.delta} {CRITERION_LABELS[n.criterion!]}:
                        </span>
                      )}
                      {n.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-text-subtle">{label}</dt>
      <dd className="mt-0.5 leading-relaxed text-text-muted">{value}</dd>
    </div>
  );
}

export function Bullets({ title, items, icon }: { title?: string; items: string[]; icon?: ReactNode }) {
  return (
    <div>
      {title && <h5 className="mb-1.5 font-semibold text-text">{title}</h5>}
      <ul className="space-y-1.5 leading-relaxed text-text-muted">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : <span aria-hidden="true">•</span>}
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
