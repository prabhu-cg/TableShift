"use client";

import { Star } from "lucide-react";
import type { Recommendation } from "@/types/recommendation";
import { Tabs } from "@/components/ui/Tabs";
import { PATTERN_GUIDANCE } from "@/lib/preview/pattern-guidance";

interface OptionPickerProps {
  recommendations: Recommendation[];
  value: string;
  onChange: (id: string) => void;
  /** "stack": ranked rows with a summary (left pane). "row": compact three-up (small screens). */
  layout: "stack" | "row";
}

/** Chooses which of the three recommended layouts is previewed. */
export function OptionPicker({ recommendations, value, onChange, layout }: OptionPickerProps) {
  return (
    <Tabs
      variant="card"
      stacked={layout === "stack"}
      label="Recommended layouts"
      idPrefix="pattern"
      value={value}
      onChange={onChange}
      items={recommendations.map((r) =>
        layout === "stack"
          ? {
              id: r.id,
              label: (
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold tabular-nums text-text"
                  >
                    {r.rank}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-text">{r.pattern}</span>
                      {r.rank === 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-text">
                          <Star className="size-3" aria-hidden="true" /> Top
                        </span>
                      )}
                      <span className="sr-only">Option {r.rank}</span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-text-muted">{PATTERN_GUIDANCE[r.patternId].summary}</span>
                  </span>
                  <span className="shrink-0 text-right" aria-label={`Suitability ${r.score} out of 100`}>
                    <span className="block text-xl font-semibold leading-none tabular-nums text-text">{r.score}</span>
                    <span className="mt-0.5 block text-[0.6875rem] text-text-subtle">/ 100</span>
                  </span>
                </span>
              ),
            }
          : {
              id: r.id,
              label: (
                <>
                  <span className="block text-xs text-text-subtle">Option {r.rank}</span>
                  <span className="block text-sm font-semibold leading-snug text-text">{r.pattern}</span>
                  <span className="mt-0.5 block text-xs tabular-nums text-text-muted">{r.score}/100</span>
                </>
              ),
            },
      )}
    />
  );
}
