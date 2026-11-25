"use client";

import { memo, useId, useMemo, useState } from "react";
import { buildPreviewModel } from "@/lib/preview/model";
import { ActionRow, CellValue, EmptyPreview, GroupedFields, IdLabel, PreviewShell, RowDetails } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

function RecordPager({ analysis, recommendation, viewportWidth }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  const [index, setIndex] = useState(0);
  const uid = useId();

  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  const last = model.rows.length - 1;
  const i = Math.min(index, last);
  const row = model.rows[i];
  const fields = model.columns.filter((c) => c !== model.titleColumn && c !== model.statusColumn);
  const twoUp = viewportWidth >= 420;

  return (
    <PreviewShell model={model}>
      <nav className="pv-pager" aria-label="Record navigation">
        <button type="button" className="pv-btn" disabled={i === 0} onClick={() => setIndex(i - 1)}>
          Previous
        </button>
        <label className="pv-pager-jump">
          <span className="sr-only">Go to record</span>
          <select value={i} onChange={(e) => setIndex(Number(e.target.value))}>
            {model.rows.map((r, n) => (
              <option key={r.id} value={n}>
                {n + 1} of {model.rows.length} · {r.title}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="pv-btn" disabled={i === last} onClick={() => setIndex(i + 1)}>
          Next
        </button>
      </nav>
      <p id={`${uid}-pos`} className="pv-gs-note" role="status" aria-live="polite">
        Record {i + 1} of {model.rows.length}
      </p>
      <article className="pv-card" aria-labelledby={`${uid}-title`}>
        <header className="pv-card-head">
          <div style={{ minWidth: 0 }}>
            <IdLabel model={model} row={row} />
            <h3 id={`${uid}-title`} className={`pv-title ${row.titleIsFallback ? "pv-title-fallback" : ""}`}>
              {row.title}
            </h3>
          </div>
          {model.statusColumn && <CellValue column={model.statusColumn} cell={row.cells[model.statusColumn.id]} />}
        </header>
        <GroupedFields columns={fields} row={row} twoUp={twoUp} full />
        <RowDetails row={row} />
        <ActionRow model={model} rowTitle={row.title} />
      </article>
    </PreviewShell>
  );
}

export const RecordPagerPreview = memo(RecordPager);
