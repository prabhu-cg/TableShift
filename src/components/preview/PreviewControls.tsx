"use client";

import { useState } from "react";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { MAX_VIEWPORT, MIN_VIEWPORT, PRESET_DEVICES, VIEWPORT_PRESETS, clampViewport } from "@/lib/preview/viewport";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-9 items-center gap-2 rounded-full px-1 text-sm text-text"
    >
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 ${
          checked ? "border-primary bg-primary" : "border-control bg-surface"
        }`}
      >
        <span
          className={`absolute top-0.5 size-3.5 rounded-full transition-[left] duration-150 ${
            checked ? "bg-primary-foreground" : "bg-control"
          }`}
          style={{ left: checked ? 18 : 2 }}
        />
      </span>
      {label}
    </button>
  );
}

interface ViewportPickerProps {
  width: number;
  onWidth: (w: number) => void;
  full: boolean;
}

/** Preset widths as one segmented control, plus a custom width that is validated and clamped. */
export function ViewportPicker({ width, onWidth, full }: ViewportPickerProps) {
  const [invalid, setInvalid] = useState(false);

  const commit = (input: HTMLInputElement) => {
    const raw = input.value.trim();
    const n = Number(raw);
    const bad = raw === "" || !Number.isFinite(n) || n < MIN_VIEWPORT || n > MAX_VIEWPORT;
    setInvalid(bad);
    const next = clampViewport(raw === "" ? width : n);
    input.value = String(next);
    onWidth(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          role="group"
          aria-label="Viewport width presets"
          className="inline-flex gap-0.5 rounded-full border border-border-strong bg-surface p-0.5"
        >
          {VIEWPORT_PRESETS.map((p) => {
            const on = !full && width === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                aria-label={`${p} pixels, ${PRESET_DEVICES[p]}`}
                title={`${PRESET_DEVICES[p]} (${p}px)`}
                disabled={full}
                onClick={() => {
                  setInvalid(false);
                  onWidth(p);
                }}
                className={`min-h-8 rounded-full px-2.5 text-sm font-medium tabular-nums transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                  on ? "bg-primary text-primary-foreground" : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-1.5 text-sm text-text-muted">
          <span className="sr-only sm:not-sr-only">Custom</span>
          <input
            key={width}
            type="number"
            inputMode="numeric"
            min={MIN_VIEWPORT}
            max={MAX_VIEWPORT}
            defaultValue={width}
            disabled={full}
            aria-label="Custom viewport width in pixels"
            aria-invalid={invalid}
            aria-describedby="viewport-help"
            onBlur={(e) => commit(e.currentTarget)}
            onKeyDown={(e) => e.key === "Enter" && commit(e.currentTarget)}
            className="min-h-9 w-[4.5rem] rounded-xl border border-control bg-surface px-2.5 text-sm tabular-nums text-text disabled:opacity-50"
          />
          <span>px</span>
        </label>
      </div>
      <p
        id="viewport-help"
        role="status"
        className={invalid ? "text-xs text-danger" : full ? "text-xs text-text-subtle" : "sr-only"}
      >
        {full
          ? "Full width: the screen fills this panel instead of a fixed phone width. Switch it off to pick a device."
          : invalid
            ? `Enter a width between ${MIN_VIEWPORT} and ${MAX_VIEWPORT} px. Adjusted to ${width}px.`
            : `Custom width can be ${MIN_VIEWPORT} to ${MAX_VIEWPORT} px.`}
      </p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={`inline-flex size-9 items-center justify-center rounded-full transition-colors duration-150 ${
        pressed ? "bg-accent text-primary-text" : "text-text-muted hover:bg-surface-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

interface PreviewTogglesProps {
  framed: boolean;
  onFramed: (v: boolean) => void;
  full: boolean;
  onFull: (v: boolean) => void;
  onReset: () => void;
  /** Present only where an expanded workspace exists (wide screens). */
  expanded?: boolean;
  onExpanded?: () => void;
}

export function PreviewToggles({ framed, onFramed, full, onFull, onReset, expanded, onExpanded }: PreviewTogglesProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <Switch checked={framed} onChange={onFramed} label="Frame" />
      <Switch checked={full} onChange={onFull} label="Full width" />
      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Reset preview" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" />
        </IconButton>
        {onExpanded && (
          <div className="hidden lg:block">
            <IconButton label={expanded ? "Collapse preview workspace" : "Expand preview workspace"} pressed={!!expanded} onClick={onExpanded}>
              {expanded ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}
