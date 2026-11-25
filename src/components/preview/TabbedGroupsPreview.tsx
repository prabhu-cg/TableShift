"use client";

import { memo, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { columnGroups } from "@/lib/features";
import { buildPreviewModel } from "@/lib/preview/model";
import { CellValue, EmptyPreview, FieldList, IdLabel, PreviewShell, RowDetails } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

interface Tab {
  id: string;
  label: string;
  columnIds: string[];
}

function TabbedGroups({ analysis, recommendation }: MobileLayoutRendererProps) {
  const model = useMemo(() => buildPreviewModel(analysis, recommendation), [analysis, recommendation]);

  // The table's own column groups become tabs. Without groups, split key fields from the rest.
  const tabs = useMemo<Tab[]>(() => {
    const groups = columnGroups(analysis.columns);
    const known = new Set(model.columns.map((c) => c.id));
    if (groups.length >= 2)
      return groups
        .map((g, i) => ({ id: `t${i}`, label: g.name, columnIds: g.columnIds.filter((id) => known.has(id)) }))
        .filter((t) => t.columnIds.length > 0);
    const out: Tab[] = [{ id: "t0", label: "Key fields", columnIds: model.visible.map((c) => c.id) }];
    if (model.secondary.length > 0) out.push({ id: "t1", label: "More", columnIds: model.secondary.map((c) => c.id) });
    return out;
  }, [analysis.columns, model]);

  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();

  if (model.empty)
    return (
      <PreviewShell model={model}>
        <EmptyPreview kind={model.empty} />
      </PreviewShell>
    );

  const current = tabs[Math.min(active, tabs.length - 1)];
  const columns = current.columnIds
    .map((id) => model.columns.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c && c !== model.titleColumn)
    // The tab already names the group, so show the bare column name inside it.
    .map((c) => (c.group ? { ...c, label: c.name } : c));

  const onKey = (e: KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <PreviewShell model={model}>
      <div role="tablist" aria-label="Column groups" className="pv-tabs">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={i === active}
            aria-controls={`${uid}-panel`}
            tabIndex={i === active ? 0 : -1}
            className="pv-tab"
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${current.id}`}>
        <ul className="pv-stack" aria-label="Records">
          {model.rows.map((row) => (
            <li key={row.id} className="pv-card">
              <header className="pv-card-head">
                <div style={{ minWidth: 0 }}>
                  <IdLabel model={model} row={row} />
                  <h3 className={`pv-title ${row.titleIsFallback ? "pv-title-fallback" : ""}`}>{row.title}</h3>
                </div>
                {model.statusColumn && current.columnIds.includes(model.statusColumn.id) === false && (
                  <CellValue column={model.statusColumn} cell={row.cells[model.statusColumn.id]} />
                )}
              </header>
              <FieldList columns={columns} row={row} twoUp full />
              {/* Expanded-row content sits on the first tab only, so it doesn't repeat on every tab. */}
              {current.id === "t0" && <RowDetails row={row} />}
            </li>
          ))}
        </ul>
      </div>
    </PreviewShell>
  );
}

export const TabbedGroupsPreview = memo(TabbedGroups);
