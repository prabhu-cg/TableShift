"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { buildPreviewModel } from "@/lib/preview/model";
import { ActionRow, CellValue, EmptyPreview, GroupedFields, IdLabel, PreviewShell, RowDetails } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

function SummarySheet({ analysis, recommendation }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [screenH, setScreenH] = useState(600);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const layer = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const uid = useId();

  const row = model.rows.find((r) => r.id === openId) ?? null;

  // The sheet is drawn inside the simulated screen, so size it to that screen, not the browser window.
  useEffect(() => {
    if (!row) return;
    const scroller = layer.current?.closest<HTMLElement>(".pv-viewport");
    if (scroller) setScreenH(scroller.clientHeight);
    closeBtn.current?.focus();
    // When the sheet closes, the list is no longer inert, so focus can go back to the row that opened it.
    return () => trigger.current?.focus();
  }, [row]);

  const close = () => setOpenId(null);

  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  const meta = model.visible.filter((c) => c !== model.titleColumn && c !== model.statusColumn).slice(0, 2);
  const others = model.columns.filter((c) => c !== model.titleColumn && c !== model.statusColumn);

  return (
    <PreviewShell model={model}>
      <ul className="pv-stack" aria-label="Records" inert={!!row} aria-hidden={row ? true : undefined}>
        {model.rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="pv-ss-row"
              aria-haspopup="dialog"
              onClick={(e) => {
                trigger.current = e.currentTarget;
                setOpenId(r.id);
              }}
            >
              <span className="pv-acc-main">
                <IdLabel model={model} row={r} />
                <span className={`pv-title ${r.titleIsFallback ? "pv-title-fallback" : ""}`}>{r.title}</span>
                {meta.length > 0 && (
                  <span className="pv-acc-meta">
                    {meta.map((c) => (
                      <span key={c.id}>
                        {c.label}: <b><CellValue column={c} cell={r.cells[c.id]} /></b>
                      </span>
                    ))}
                  </span>
                )}
              </span>
              {model.statusColumn && <CellValue column={model.statusColumn} cell={r.cells[model.statusColumn.id]} />}
              <span className="pv-chevron" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div ref={layer} className="pv-sheet-layer">
        {row && (
          <>
            <div className="pv-sheet-backdrop" style={{ height: screenH }} onClick={close} aria-hidden="true" />
            <div
              className="pv-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${uid}-title`}
              style={{ maxHeight: Math.round(screenH * 0.82) }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  close();
                }
              }}
            >
              <span className="pv-sheet-grip" aria-hidden="true" />
              <header className="pv-sheet-head">
                <div style={{ minWidth: 0 }}>
                  <IdLabel model={model} row={row} />
                  <h3 id={`${uid}-title`} className={`pv-title ${row.titleIsFallback ? "pv-title-fallback" : ""}`}>
                    {row.title}
                  </h3>
                </div>
                {model.statusColumn && <CellValue column={model.statusColumn} cell={row.cells[model.statusColumn.id]} />}
                <button ref={closeBtn} type="button" className="pv-btn pv-btn--quiet" onClick={close}>
                  Close
                </button>
              </header>
              <div className="pv-sheet-body">
                <GroupedFields columns={others} row={row} twoUp full />
                <RowDetails row={row} />
                <ActionRow model={model} rowTitle={row.title} />
              </div>
            </div>
          </>
        )}
      </div>
    </PreviewShell>
  );
}

export const SummarySheetPreview = memo(SummarySheet);
