"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  /** Prefix for tab ids; panels use `${idPrefix}-panel-${id}`. */
  idPrefix: string;
  /**
   * "pill": small amber-fill toggle. "card": larger selectable option (butter selection).
   * "line": text tabs with an underline for sections inside a panel.
   */
  variant?: "pill" | "card" | "line";
  /** For "card": stack the options vertically instead of one row. */
  stacked?: boolean;
  className?: string;
}

/** Accessible tab list with roving tabindex and arrow-key navigation. Panels are rendered by the caller. */
export function Tabs({ items, value, onChange, label, idPrefix, variant = "pill", stacked = false, className = "" }: TabsProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const move = (e: KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    const id = items[next].id;
    onChange(id);
    refs.current.get(id)?.focus();
  };

  const wrap =
    variant === "pill"
      ? "inline-flex max-w-full gap-1 rounded-full border border-border-strong bg-surface p-1"
      : variant === "line"
        ? "flex flex-wrap gap-x-1 border-b border-border"
        : "grid gap-2";
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`${wrap} ${className}`}
      style={variant === "card" && !stacked ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined}
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        const base =
          variant === "pill"
            ? `min-h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150 ${
                selected ? "bg-primary text-primary-foreground" : "text-text-muted hover:bg-surface-muted hover:text-text"
              }`
            : variant === "line"
              ? `-mb-px min-h-10 border-b-2 px-3 text-sm font-medium transition-colors duration-150 ${
                  selected ? "border-primary text-text" : "border-transparent text-text-muted hover:text-text"
                }`
              : `rounded-xl border p-3 text-left transition-colors duration-150 ${
                  selected ? "border-primary bg-accent" : "border-border bg-surface hover:bg-surface-muted"
                }`;
        return (
          <button
            key={item.id}
            ref={(el) => {
              if (el) refs.current.set(item.id, el);
              else refs.current.delete(item.id);
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => move(e, i)}
            className={base}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
