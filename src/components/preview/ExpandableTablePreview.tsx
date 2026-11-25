"use client";

import { memo, useId, useMemo, useState } from "react";
import { buildPreviewModel } from "@/lib/preview/model";
import { ActionRow, CellValue, EmptyPreview, GroupedFields, IdLabel, PreviewShell, RowDetails } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

const SUMMARY_FIELDS = 2;

function ExpandableTable({ analysis, recommendation }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const uid = useId();

  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  // The collapsed row shows the identifier, status and a couple of key fields.
  const summary = model.visible
    .filter((c) => c !== model.titleColumn && c !== model.statusColumn)
    .slice(0, SUMMARY_FIELDS);
  const shownInHeader = new Set([model.titleColumn?.id, model.statusColumn?.id, ...summary.map((c) => c.id)]);
  // Everything else is in the expanded area, so no field is lost.
  const rest = model.columns.filter((c) => !shownInHeader.has(c.id));

  const allOpen = open.size === model.rows.length;
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <PreviewShell model={model}>
      {rest.length + (model.actions.length ? 1 : 0) > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="pv-btn pv-btn--quiet"
            onClick={() => setOpen(allOpen ? new Set() : new Set(model.rows.map((r) => r.id)))}
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
      )}
      <ul className="pv-stack" aria-label="Records">
        {model.rows.map((row) => {
          const isOpen = open.has(row.id);
          const panelId = `${uid}-${row.id}-panel`;
          const headId = `${uid}-${row.id}-head`;
          return (
            <li key={row.id} className="pv-acc">
              <h3 style={{ margin: 0 }}>
                <button
                  type="button"
                  id={headId}
                  className="pv-acc-head"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(row.id)}
                >
                  <span className="pv-acc-main">
                    <IdLabel model={model} row={row} />
                    <span className={`pv-title ${row.titleIsFallback ? "pv-title-fallback" : ""}`}>{row.title}</span>
                    {summary.length > 0 && (
                      <span className="pv-acc-meta">
                        {summary.map((c) => (
                          <span key={c.id}>
                            {c.label}: <b><CellValue column={c} cell={row.cells[c.id]} /></b>
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  {model.statusColumn && <CellValue column={model.statusColumn} cell={row.cells[model.statusColumn.id]} />}
                  <span className={`pv-chevron ${isOpen ? "pv-chevron--down" : ""}`} aria-hidden="true" />
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={headId} hidden={!isOpen} className="pv-acc-panel">
                <GroupedFields columns={rest} row={row} twoUp full />
                <RowDetails row={row} />
                <ActionRow model={model} rowTitle={row.title} />
                {rest.length === 0 && model.actions.length === 0 && row.details.length === 0 && <span className="pv-muted">All fields are shown above.</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </PreviewShell>
  );
}

export const ExpandableTablePreview = memo(ExpandableTable);
