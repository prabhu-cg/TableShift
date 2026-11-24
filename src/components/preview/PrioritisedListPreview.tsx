"use client";

import { memo, useId, useMemo, useState } from "react";
import { buildPreviewModel } from "@/lib/preview/model";
import { ActionRow, CellValue, EmptyPreview, GroupedFields, PreviewShell } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

function PrioritisedList({ analysis, recommendation }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  const [showSecondary, setShowSecondary] = useState(false);
  const uid = useId();

  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  const hasMore = model.secondary.length > 0 || model.actions.length > 0;
  const parts = [
    model.secondary.length > 0 && `${model.secondary.length} more ${model.secondary.length === 1 ? "field" : "fields"}`,
    model.actions.length > 0 && "row actions",
  ].filter(Boolean);

  return (
    <PreviewShell model={model}>
      {hasMore && (
        <label className="pv-switch">
          <input
            type="checkbox"
            role="switch"
            checked={showSecondary}
            onChange={(e) => setShowSecondary(e.target.checked)}
            aria-controls={`${uid}-table`}
          />
          <span>
            Show secondary details
            <span className="pv-muted" style={{ fontWeight: 400 }}> ({parts.join(" and ")})</span>
          </span>
        </label>
      )}
      <div className="pv-prio">
        <table className="pv-prio-table" id={`${uid}-table`}>
          <caption className="sr-only">Records, priority columns</caption>
          <thead>
            <tr>
              {model.visible.map((c) => (
                <th key={c.id} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.flatMap((row) => {
              const main = (
                <tr key={row.id} className="pv-main">
                  {model.visible.map((c) =>
                    c === model.titleColumn ? (
                      <th key={c.id} scope="row" className={row.titleIsFallback ? "pv-title-fallback" : ""}>
                        {row.title}
                      </th>
                    ) : (
                      <td key={c.id}>
                        <CellValue column={c} cell={row.cells[c.id]} />
                      </td>
                    ),
                  )}
                </tr>
              );
              if (!showSecondary || !hasMore) return [main];
              return [
                main,
                <tr key={`${row.id}-more`}>
                  <td colSpan={Math.max(1, model.visible.length)} style={{ padding: 0 }}>
                    <div className="pv-sec-cell">
                      <GroupedFields columns={model.secondary} row={row} twoUp full />
                      <ActionRow model={model} rowTitle={row.title} />
                    </div>
                  </td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
    </PreviewShell>
  );
}

export const PrioritisedListPreview = memo(PrioritisedList);
