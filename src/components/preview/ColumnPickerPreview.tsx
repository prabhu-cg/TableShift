"use client";

import { memo, useId, useMemo, useState } from "react";
import { actionLabel, buildPreviewModel } from "@/lib/preview/model";
import { CellValue, EmptyPreview, PreviewShell } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

function ColumnPicker({ analysis, recommendation }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(model.visible.map((c) => c.id)));
  const [open, setOpen] = useState(false);
  const uid = useId();

  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  const title = model.titleColumn;
  // The record title column always stays; the rest follow the user's choice, in source order.
  const shown = model.columns.filter((c) => c === title || chosen.has(c.id));
  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const hasActions = model.actions.length > 0;

  return (
    <PreviewShell model={model}>
      <div className="pv-picker">
        <button
          type="button"
          className="pv-btn pv-picker-btn"
          aria-expanded={open}
          aria-controls={`${uid}-panel`}
          onClick={() => setOpen((v) => !v)}
        >
          Columns · {shown.length} of {model.columns.length}
          <span className={`pv-chevron ${open ? "pv-chevron--down" : ""}`} aria-hidden="true" />
        </button>
        {open && (
          <fieldset id={`${uid}-panel`} className="pv-picker-panel">
            <legend>Show columns</legend>
            <div className="pv-picker-list">
              {model.columns.map((c) => (
                <label key={c.id} className="pv-picker-opt">
                  <input
                    type="checkbox"
                    checked={c === title || chosen.has(c.id)}
                    disabled={c === title}
                    onChange={() => toggle(c.id)}
                  />
                  <span>
                    {c.label}
                    {c === title && <span className="pv-muted"> (always shown)</span>}
                  </span>
                </label>
              ))}
            </div>
            <button type="button" className="pv-btn" onClick={() => setOpen(false)}>
              Done
            </button>
          </fieldset>
        )}
      </div>
      <div className="pv-scroll-wrap">
        <div className="pv-scroll" role="region" tabIndex={0} aria-label="Records table, scrolls horizontally">
          <table className="pv-table">
            <caption className="sr-only">Records, {shown.length} columns shown</caption>
            <thead>
              <tr>
                {shown.map((c) => (
                  <th key={c.id} scope="col">
                    {c.label}
                  </th>
                ))}
                {hasActions && <th scope="col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {model.rows.map((row) => (
                <tr key={row.id}>
                  {shown.map((c, i) =>
                    i === 0 ? (
                      <th key={c.id} scope="row" className={c === title && row.titleIsFallback ? "pv-title-fallback" : ""}>
                        {c === title ? row.title : <CellValue column={c} cell={row.cells[c.id]} />}
                      </th>
                    ) : (
                      <td key={c.id}>
                        <CellValue column={c} cell={row.cells[c.id]} />
                      </td>
                    ),
                  )}
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
      </div>
    </PreviewShell>
  );
}

export const ColumnPickerPreview = memo(ColumnPicker);
