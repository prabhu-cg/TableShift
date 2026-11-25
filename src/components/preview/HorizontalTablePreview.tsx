"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { actionLabel, buildPreviewModel } from "@/lib/preview/model";
import { CellValue, EmptyPreview, PreviewShell } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

function HorizontalTable({ analysis, recommendation, viewportWidth }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const uid = useId();

  // Track whether more columns lie off-screen so the scroll cue is accurate, not decorative.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () =>
      setEdges({
        left: el.scrollLeft > 1,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [model, viewportWidth]);

  if (model.empty === "no-columns")
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind="no-columns" />
      </PreviewShell>
    );

  const hasActions = model.actions.length > 0;
  // Consecutive columns that share a group sit under one spanning header.
  const spans: { group: string; span: number }[] = [];
  for (const c of model.columns) {
    const last = spans[spans.length - 1];
    if (last && c.group && last.group === c.group) last.span += 1;
    else spans.push({ group: c.group, span: 1 });
  }
  return (
    <PreviewShell model={model}>
      <div className="pv-scroll-wrap">
        <p className="pv-hint" aria-live="polite">
          {edges.right
            ? `Scroll sideways to see all ${model.columns.length + (hasActions ? 1 : 0)} columns.`
            : edges.left
              ? "You've reached the last column."
              : "All columns fit at this width."}
        </p>
        <div
          ref={scroller}
          className="pv-scroll"
          role="region"
          tabIndex={0}
          aria-label="Records table, scrolls horizontally"
        >
          <table className="pv-table" aria-describedby={`${uid}-note`}>
            <caption className="sr-only">Records</caption>
            <thead>
              {spans.some((s) => s.group) && (
                <tr className="pv-group-row">
                  {spans.map((s, i) => (
                    <th key={i} scope="colgroup" colSpan={s.span} className={s.group ? "pv-group" : undefined}>
                      {s.group}
                    </th>
                  ))}
                  {hasActions && <th />}
                </tr>
              )}
              <tr>
                {model.columns.map((c) => (
                  <th key={c.id} scope="col">
                    {c.group ? c.name : c.label}
                  </th>
                ))}
                {hasActions && <th scope="col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {model.rows.map((row) => (
                <tr key={row.id}>
                  {model.columns.map((c, i) => {
                    const content = <CellValue column={c} cell={row.cells[c.id]} />;
                    return i === 0 ? (
                      <th key={c.id} scope="row">
                        {content}
                      </th>
                    ) : (
                      <td key={c.id}>{content}</td>
                    );
                  })}
                  {hasActions && (
                    <td>
                      <div className="pv-actions">
                        {model.actions.map((a, i) => (
                          <button key={i} type="button" className="pv-btn" aria-disabled="true" onClick={(e) => e.preventDefault()}>
                            {actionLabel(a)}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {model.empty === "no-rows" && <EmptyPreview kind="no-rows" />}
        <span id={`${uid}-note`} className="sr-only">
          The first column stays in place while you scroll.
        </span>
      </div>
    </PreviewShell>
  );
}

export const HorizontalTablePreview = memo(HorizontalTable);
