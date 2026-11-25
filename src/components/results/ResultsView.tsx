"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { TableAnalysis, TableColumn } from "@/types/analysis";
import type { ScreenshotInput } from "@/types/screenshot";
import { assessAnalysis } from "@/lib/analysis-assessment";
import { deriveFeatures } from "@/lib/features";
import { recommend } from "@/lib/recommendation/engine";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { InfoPanel } from "@/components/ui/InfoPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Tabs } from "@/components/ui/Tabs";
import { CompareView } from "./CompareView";
import { OptionPicker } from "./OptionPicker";
import { PreviewWorkspace } from "./PreviewWorkspace";
import { RecommendationDetails } from "./RecommendationDetails";
import { TablePanel } from "./TablePanel";

interface ResultsViewProps {
  screenshot: ScreenshotInput;
  analysis: TableAnalysis;
  provider: { name: string; model: string };
  onBack: () => void;
  onRetry: () => void;
}

type View = "single" | "compare";
type Tab = "preview" | "options" | "table";

export function ResultsView({ screenshot, analysis, provider, onBack, onRetry }: ResultsViewProps) {
  // User corrections to column label / type / importance, keyed by column id.
  const [edits, setEdits] = useState<Record<string, Partial<TableColumn>>>({});
  const [view, setView] = useState<View>("single");
  const [tab, setTab] = useState<Tab>("preview");
  const [expanded, setExpanded] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  // Size the sticky preview column to the room left under the header, so the whole preview and its
  // controls fit the viewport. Measured, because the header bar wraps and banners come and go.
  const grid = useRef<HTMLDivElement>(null);
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!isDesktop) return;
    const measure = () => {
      const el = grid.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setStageHeight(Math.max(448, Math.round(window.innerHeight - top - 16)));
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [isDesktop, view, tab, expanded, edits]);

  const columns = useMemo(() => analysis.columns.map((c) => ({ ...c, ...edits[c.id] })), [analysis.columns, edits]);
  // Features are re-derived from the corrected columns, then the deterministic engine re-runs.
  // Nothing here touches the vision provider: edits, pattern changes and viewport changes are local.
  const corrected = useMemo<TableAnalysis>(
    () => ({ ...analysis, columns, features: deriveFeatures(columns, analysis.rows, analysis.actions) }),
    [analysis, columns],
  );
  const assessment = useMemo(() => assessAnalysis(corrected), [corrected]);
  const result = useMemo(() => (assessment.status === "blocked" ? null : recommend(corrected)), [assessment.status, corrected]);

  const recs = result?.recommendations ?? [];
  const others = result?.others ?? [];
  const [showAll, setShowAll] = useState(false);
  // A lower-ranked option stays visible while it is the one being previewed.
  const pickedOther = others.some((o) => o.id === pickedId);
  const listed = showAll || pickedOther ? [...recs, ...others] : recs;
  // Keep the chosen pattern across re-ranking when it is still available.
  const selected = [...recs, ...others].find((r) => r.id === pickedId) ?? recs[0] ?? null;
  const pickerExtras = {
    otherCount: others.length,
    showAll: showAll || pickedOther,
    onToggleAll: () => {
      if (showAll || pickedOther) {
        setShowAll(false);
        if (pickedOther) setPickedId(recs[0]?.id ?? "");
      } else setShowAll(true);
    },
  };

  const tablePanelProps = {
    screenshot,
    analysis,
    corrected,
    columns,
    provider,
    onChange: (id: string, patch: Partial<Pick<TableColumn, "name" | "dataType" | "importance">>) =>
      setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } })),
    onReset: () => setEdits({}),
  };

  const f = corrected.features;
  // On wide screens the left pane has two sections and the preview is always on the right.
  const leftSection: "options" | "table" = tab === "table" ? "table" : "options";
  const sectionTabs = isDesktop ? (
    <Tabs
      label="Results sections"
      idPrefix="section"
      value={leftSection}
      onChange={(v) => setTab(v as Tab)}
      items={[
        { id: "options", label: "Options" },
        { id: "table", label: `Detected table (${f.columnCount})` },
      ]}
    />
  ) : (
    <Tabs
      label="Results sections"
      idPrefix="section"
      value={tab}
      onChange={(v) => setTab(v as Tab)}
      items={[
        { id: "preview", label: "Preview" },
        { id: "options", label: "Options" },
        { id: "table", label: `Table (${f.columnCount})` },
      ]}
    />
  );

  // One option picker at a time, so ids stay unique: ranked rows beside the preview on wide screens,
  // a compact row above the preview on small screens or when the left pane is collapsed.
  const showStackPicker = isDesktop ? !expanded : tab === "options";
  const showRowPicker = isDesktop ? expanded : tab === "preview";

  const leftClass = expanded ? (tab === "preview" ? "hidden" : "block lg:hidden") : tab === "preview" ? "hidden lg:block" : "block";
  const rightClass = `${tab === "preview" ? "flex" : "hidden"} lg:flex`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h1 className="text-2xl text-text">Analysis results</h1>
          <p className="text-text-muted">
            {f.columnCount} columns · {f.rowCount} rows read · {Math.round(analysis.confidence * 100)}% detection
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selected && (
            <Tabs
              label="Results view"
              idPrefix="view"
              value={view}
              onChange={(v) => setView(v as View)}
              items={[
                { id: "single", label: "Single view" },
                { id: "compare", label: "Compare" },
              ]}
            />
          )}
          <PrimaryButton
            variant="secondary"
            size="sm"
            className="px-3 sm:px-4"
            aria-label="Back to screenshot"
            onClick={onBack}
            icon={<ArrowLeft className="size-4" aria-hidden="true" />}
          >
            <span className="hidden sm:inline">Back to screenshot</span>
          </PrimaryButton>
          <PrimaryButton
            variant="secondary"
            size="sm"
            className="px-3 sm:px-4"
            aria-label="Re-run analysis"
            onClick={onRetry}
            icon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            <span className="hidden sm:inline">Re-run</span>
          </PrimaryButton>
        </div>
      </div>

      {assessment.status === "blocked" && (
        <>
          <ErrorMessage error={{ title: assessment.title!, message: assessment.message! }}>
            <PrimaryButton variant="secondary" size="sm" onClick={onRetry}>
              Retry analysis
            </PrimaryButton>
            <PrimaryButton variant="ghost" size="sm" onClick={onBack}>
              Use a different screenshot
            </PrimaryButton>
          </ErrorMessage>
          <div className="max-w-xl">
            <TablePanel {...tablePanelProps} showColumns={false} />
          </div>
        </>
      )}

      {assessment.status === "caution" && (
        <InfoPanel tone="warning" title="Some of this was hard to read">
          <p>
            Detection confidence is {Math.round(analysis.confidence * 100)}%. Review the detected columns before relying on the
            recommendations. Low-confidence values are underlined with dashes in the previews.
          </p>
        </InfoPanel>
      )}

      {selected && view === "compare" && (
        <CompareView
          analysis={corrected}
          recommendations={recs}
          onOpen={(id) => {
            setPickedId(id);
            setView("single");
          }}
        />
      )}

      {selected && view === "single" && (
        <>
          {!isDesktop && sectionTabs}
          <div ref={grid} className={`grid items-start gap-5 ${expanded ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_26rem]"}`}>
            <section aria-label="Options and detected table" className={`${leftClass} min-w-0 space-y-4`}>
              {isDesktop && sectionTabs}
              {leftSection === "options" ? (
                <div id="section-panel-options" role="tabpanel" aria-labelledby="section-tab-options" className="space-y-5">
                  {showStackPicker && <OptionPicker layout="stack" recommendations={listed} value={selected.id} onChange={setPickedId} {...pickerExtras} />}
                  <RecommendationDetails rec={selected} analysis={corrected} />
                </div>
              ) : (
                <div id="section-panel-table" role="tabpanel" aria-labelledby="section-tab-table">
                  <TablePanel {...tablePanelProps} />
                </div>
              )}
            </section>

            <section
              aria-label="Mobile preview"
              className={`${rightClass} min-w-0 flex-col gap-3 lg:sticky lg:top-4`}
              style={isDesktop && stageHeight ? { height: stageHeight } : undefined}
            >
              {showRowPicker && <OptionPicker layout="row" recommendations={listed} value={selected.id} onChange={setPickedId} {...pickerExtras} />}
              <div className="min-h-0 flex-1">
                <PreviewWorkspace
                  analysis={corrected}
                  recommendation={selected}
                  fillHeight={isDesktop}
                  expanded={expanded}
                  onExpanded={() => setExpanded((v) => !v)}
                />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
