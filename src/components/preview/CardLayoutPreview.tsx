"use client";

import { memo, useMemo } from "react";
import { buildPreviewModel } from "@/lib/preview/model";
import { ActionRow, CellValue, EmptyPreview, GroupedFields, IdLabel, PreviewShell } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

function CardLayout({ analysis, recommendation, viewportWidth }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  const twoUp = viewportWidth >= 420;
  const body = model.visible.filter((c) => c !== model.titleColumn && c !== model.statusColumn);

  return (
    <PreviewShell model={model}>
      <ul className="pv-stack" aria-label="Records">
        {model.rows.map((row) => (
          <li key={row.id}>
            <article className="pv-card" aria-labelledby={`card-${row.id}`}>
              <header className="pv-card-head">
                <div style={{ minWidth: 0 }}>
                  <IdLabel model={model} row={row} />
                  <h3 id={`card-${row.id}`} className={`pv-title ${row.titleIsFallback ? "pv-title-fallback" : ""}`}>
                    {row.title}
                  </h3>
                </div>
                {model.statusColumn && <CellValue column={model.statusColumn} cell={row.cells[model.statusColumn.id]} />}
              </header>
              <GroupedFields columns={body} row={row} twoUp={twoUp} />
              {model.secondary.length > 0 && (
                <details className="pv-details">
                  <summary>More details ({model.secondary.length})</summary>
                  <div className="pv-details-body">
                    <GroupedFields columns={model.secondary} row={row} twoUp={twoUp} full />
                  </div>
                </details>
              )}
              <ActionRow model={model} rowTitle={row.title} />
            </article>
          </li>
        ))}
      </ul>
    </PreviewShell>
  );
}

export const CardLayoutPreview = memo(CardLayout);
