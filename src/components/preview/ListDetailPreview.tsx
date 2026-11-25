"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { buildPreviewModel } from "@/lib/preview/model";
import { ActionRow, CellValue, EmptyPreview, GroupedFields, IdLabel, PreviewShell, RowDetails } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

function ListDetail({ analysis, recommendation }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  const [selected, setSelected] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const lastOpened = useRef<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());

  // Move focus into the detail view on open and back to the chosen list item on return.
  useEffect(() => {
    if (selected) heading.current?.focus();
    else if (lastOpened.current) itemRefs.current.get(lastOpened.current)?.focus();
  }, [selected]);

  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  const row = model.rows.find((r) => r.id === selected) ?? null;
  const open = (id: string) => {
    lastOpened.current = id;
    setSelected(id);
  };
  const back = () => setSelected(null);

  if (row) {
    const others = model.columns.filter((c) => c !== model.titleColumn);
    return (
      <PreviewShell
        model={model}
        heading="Record"
        leading={
          <button type="button" className="pv-back" onClick={back}>
            All records
          </button>
        }
      >
        <div
          className="pv-detail"
          onKeyDown={(e) => {
            if (e.key === "Escape") back();
          }}
        >
          <div>
          <IdLabel model={model} row={row} />
          <h3
            ref={heading}
            tabIndex={-1}
            className={`pv-title ${row.titleIsFallback ? "pv-title-fallback" : ""}`}
            style={{ fontSize: 18 }}
          >
            {row.title}
          </h3>
          </div>
          <GroupedFields columns={others} row={row} twoUp full />
          <RowDetails row={row} />
          <ActionRow model={model} rowTitle={row.title} />
        </div>
      </PreviewShell>
    );
  }

  const meta = model.visible.filter((c) => c !== model.titleColumn && c !== model.statusColumn).slice(0, 1);
  return (
    <PreviewShell model={model}>
      <ul className="pv-list" aria-label="Records">
        {model.rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="pv-list-item"
              ref={(el) => {
                if (el) itemRefs.current.set(r.id, el);
                else itemRefs.current.delete(r.id);
              }}
              onClick={() => open(r.id)}
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
              <span className="sr-only">Open record</span>
            </button>
          </li>
        ))}
      </ul>
    </PreviewShell>
  );
}

export const ListDetailPreview = memo(ListDetail);
