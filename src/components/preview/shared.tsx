import type { ReactNode } from "react";
import {
  actionLabel,
  groupFields,
  statusTone,
  type PreviewCell,
  type PreviewColumn,
  type PreviewModel,
  type PreviewRow,
} from "@/lib/preview/model";

/** One extracted value, rendered according to its detected data type. Text is never altered. */
export function CellValue({ column, cell }: { column: PreviewColumn; cell: PreviewCell }) {
  if (cell.state === "missing")
    return (
      <span className="pv-muted">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not available</span>
      </span>
    );
  if (cell.state === "unreadable") return <span className="pv-muted pv-italic">Unreadable</span>;

  const uncertain = column.uncertain ? "pv-uncertain" : "";
  const title = column.uncertain ? "Read with low confidence" : undefined;
  if (column.dataType === "status")
    return (
      <span className={`pv-badge pv-badge--${statusTone(cell.text)} ${uncertain}`} title={title}>
        {cell.text}
      </span>
    );
  const numeric = column.dataType === "currency" || column.dataType === "number";
  return (
    <span className={`${numeric ? "pv-num" : ""} ${uncertain}`} title={title}>
      {cell.text}
    </span>
  );
}

/** The identifier column's label, so the title stays traceable to its source column. */
export function IdLabel({ model, row }: { model: PreviewModel; row: PreviewRow }) {
  if (!model.titleColumn || row.titleIsFallback) return null;
  return <span className="pv-idlabel">{model.titleColumn.label}</span>;
}

/** Labelled values for the given columns. */
export function FieldList({
  columns,
  row,
  twoUp = false,
  full = false,
}: {
  columns: PreviewColumn[];
  row: PreviewRow;
  twoUp?: boolean;
  full?: boolean;
}) {
  if (columns.length === 0) return null;
  return (
    <dl className={`pv-dl ${twoUp ? "pv-dl--2" : ""} ${full ? "pv-dl--full" : ""}`}>
      {columns.map((c) => (
        <div key={c.id} className="pv-field">
          <dt>{c.label}</dt>
          <dd>
            <CellValue column={c} cell={row.cells[c.id]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Fields split into related groups (details, amounts, dates). Group names show only when there are several. */
export function GroupedFields({
  columns,
  row,
  twoUp,
  full,
}: {
  columns: PreviewColumn[];
  row: PreviewRow;
  twoUp?: boolean;
  full?: boolean;
}) {
  const groups = groupFields(columns);
  if (groups.length === 0) return null;
  return (
    <>
      {groups.map((g) => (
        <div key={g.key} className="pv-group">
          {groups.length > 1 && <p className="pv-group-label">{g.label}</p>}
          <FieldList columns={g.columns} row={row} twoUp={twoUp} full={full} />
        </div>
      ))}
    </>
  );
}

/**
 * Row actions detected in the screenshot. The preview has no backend, so these show the layout
 * only: they're marked aria-disabled and do nothing when pressed.
 */
export function ActionRow({ model, rowTitle }: { model: PreviewModel; rowTitle: string }) {
  if (model.actions.length === 0) return null;
  return (
    <div className="pv-actions" role="group" aria-label={`Actions for ${rowTitle}`}>
      {model.actions.map((a, i) => (
        <button
          key={`${a.label}-${i}`}
          type="button"
          className="pv-btn"
          aria-disabled="true"
          onClick={(e) => e.preventDefault()}
        >
          {actionLabel(a)}
        </button>
      ))}
    </div>
  );
}

export function EmptyPreview({ kind }: { kind: "no-columns" | "no-rows" | "unsupported" | "no-recommendation" }) {
  const copy = {
    "no-columns": ["No columns to show", "The analysis didn't contain any readable columns."],
    "no-rows": ["No rows were readable", "Columns were detected but no row values could be read from the screenshot."],
    unsupported: ["This layout isn't available", "No renderer exists for the selected pattern."],
    "no-recommendation": ["No recommendation selected", "Choose one of the recommended layouts to preview it."],
  }[kind];
  return (
    <div className="pv-empty" role="status">
      <strong>{copy[0]}</strong>
      {copy[1]}
    </div>
  );
}

/** App bar, body and footnote shared by every pattern so the previews look like one product. */
export function PreviewShell({
  model,
  children,
  leading,
  heading = "Records",
}: {
  model: PreviewModel;
  children: ReactNode;
  leading?: ReactNode;
  heading?: string;
}) {
  const n = model.rows.length;
  return (
    <div className="pv-app">
      <div className="pv-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {leading}
          <h2 className="pv-bar-title">{heading}</h2>
        </div>
        <span className="pv-count">
          {n} {n === 1 ? "record" : "records"}
        </span>
      </div>
      <div className="pv-body">{children}</div>
      <p className="pv-footnote">
        {model.actions.length > 0 && "Row actions show the layout only. "}
        {model.hasLowConfidence && "Dashed values were read with low confidence."}
      </p>
    </div>
  );
}

/** Expanded or nested content captured for a row (document lists, nested rows). Absent when there is none. */
export function RowDetails({ row }: { row: PreviewRow }) {
  if (row.details.length === 0) return null;
  return (
    <div className="pv-details">
      {row.details.map((d, i) => (
        <section key={i} className="pv-details-block">
          {d.heading && <h4 className="pv-details-heading">{d.heading}</h4>}
          <ul className="pv-details-list">
            {d.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
