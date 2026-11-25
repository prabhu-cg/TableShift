"use client";

import { useState } from "react";
import type { TableAnalysis } from "@/types/analysis";
import type { Recommendation } from "@/types/recommendation";
import { DEFAULT_VIEWPORT } from "@/lib/preview/viewport";
import { MobileLayoutRenderer } from "@/components/preview/MobileLayoutRenderer";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { PreviewToggles, ViewportPicker } from "@/components/preview/PreviewControls";

interface PreviewWorkspaceProps {
  analysis: TableAnalysis;
  recommendation: Recommendation;
  /** Fit the stage to its parent's height (wide screens), so the preview needs no scrolling. */
  fillHeight: boolean;
  expanded?: boolean;
  onExpanded?: () => void;
}

/**
 * The live preview: viewport picker, a stage holding the device, and its toggles.
 * Viewport and frame changes are local state: they never trigger another analysis.
 */
export function PreviewWorkspace({ analysis, recommendation, fillHeight, expanded, onExpanded }: PreviewWorkspaceProps) {
  const [width, setWidth] = useState(DEFAULT_VIEWPORT);
  const [framed, setFramed] = useState(true);
  const [full, setFull] = useState(false);

  return (
    <div className={`flex flex-col gap-3 ${fillHeight ? "h-full min-h-0" : ""}`}>
      <ViewportPicker width={width} onWidth={setWidth} full={full} />
      <div
        role="tabpanel"
        id={`pattern-panel-${recommendation.id}`}
        aria-labelledby={`pattern-tab-${recommendation.id}`}
        className={`rounded-xl bg-surface-muted p-2.5 ${fillHeight ? "min-h-0 flex-1" : ""}`}
      >
        <PreviewFrame
          viewportWidth={width}
          full={full}
          framed={framed}
          fillHeight={fillHeight}
          label={`${recommendation.pattern} preview`}
        >
          {(vw) => <MobileLayoutRenderer analysis={analysis} recommendation={recommendation} viewportWidth={vw} />}
        </PreviewFrame>
      </div>
      <PreviewToggles
        framed={framed}
        onFramed={setFramed}
        full={full}
        onFull={setFull}
        expanded={expanded}
        onExpanded={onExpanded}
        onReset={() => {
          setWidth(DEFAULT_VIEWPORT);
          setFramed(true);
          setFull(false);
        }}
      />
    </div>
  );
}
