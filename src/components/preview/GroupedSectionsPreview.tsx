"use client";

import { memo, useId, useMemo, useState } from "react";
import { findSectionColumn } from "@/lib/features";
import { buildPreviewModel, type PreviewRow } from "@/lib/preview/model";
import { CellValue, EmptyPreview, IdLabel, PreviewShell, RowDetails } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

interface Section {
  key: string;
  label: string;
  rows: PreviewRow[];
}

function GroupedSections({ analysis, recommendation }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);
  const sectionColumn = useMemo(() => {
    const found = findSectionColumn(analysis.columns, analysis.rows);
    return found ? (model.columns.find((c) => c.id === found.id) ?? null) : null;
  }, [analysis, model.columns]);

  const sections = useMemo<Section[]>(() => {
    if (!sectionColumn) return [{ key: "all", label: "All records", rows: model.rows }];
    const map = new Map<string, Section>();
    for (const row of model.rows) {
      const cell = row.cells[sectionColumn.id];
      const label = cell.state === "value" ? cell.text.trim() : "No value";
      const key = label.toLowerCase();
      const section = map.get(key) ?? { key, label, rows: [] };
      section.rows.push(row);
      map.set(key, section);
    }
    return [...map.values()];
  }, [model.rows, sectionColumn]);

  const [open, setOpen] = useState<Set<string>>(() => new Set(sections.slice(0, 1).map((s) => s.key)));
  const uid = useId();

  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  const meta = model.visible.filter((c) => c !== model.titleColumn && c !== sectionColumn).slice(0, 3);
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <PreviewShell model={model}>
      {sectionColumn && (
        <p className="pv-muted pv-gs-note">
          Grouped by {sectionColumn.label} · {sections.length} sections
        </p>
      )}
      <div className="pv-stack">
        {sections.map((s) => {
          const isOpen = open.has(s.key);
          const panelId = `${uid}-${s.key.replace(/\W+/g, "-")}-panel`;
          return (
            <section key={s.key} className="pv-acc">
              <h3 style={{ margin: 0 }}>
                <button
                  type="button"
                  className="pv-acc-head"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(s.key)}
                >
                  <span className="pv-acc-main">
                    <span className="pv-title">{s.label}</span>
                  </span>
                  <span className="pv-count">
                    {s.rows.length} {s.rows.length === 1 ? "record" : "records"}
                  </span>
                  <span className={`pv-chevron ${isOpen ? "pv-chevron--down" : ""}`} aria-hidden="true" />
                </button>
              </h3>
              <ul id={panelId} hidden={!isOpen} className="pv-gs-list" aria-label={`${s.label} records`}>
                {s.rows.map((row) => (
                  <li key={row.id} className="pv-gs-row">
                    <IdLabel model={model} row={row} />
                    <span className={`pv-title ${row.titleIsFallback ? "pv-title-fallback" : ""}`}>{row.title}</span>
                    {meta.length > 0 && (
                      <span className="pv-acc-meta">
                        {meta.map((c) => (
                          <span key={c.id}>
                            {c.label}: <b><CellValue column={c} cell={row.cells[c.id]} /></b>
                          </span>
                        ))}
                      </span>
                    )}
                    <RowDetails row={row} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </PreviewShell>
  );
}

export const GroupedSectionsPreview = memo(GroupedSections);
