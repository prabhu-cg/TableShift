export const VIEWPORT_PRESETS = [320, 360, 375, 390, 430] as const;
export const DEFAULT_VIEWPORT = 390;
export const MIN_VIEWPORT = 280;
export const MAX_VIEWPORT = 600;
/** Full-width mode follows the available space, within sane bounds. */
export const MAX_FULL_WIDTH = 1024;
/** Real devices these preset widths stand for (shown in tooltips and the caption). */
export const PRESET_DEVICES: Record<number, string> = {
  320: "Small phone",
  360: "Android phone",
  375: "iPhone SE / mini",
  390: "iPhone 14",
  430: "iPhone Pro Max",
};

export function deviceName(width: number): string {
  return PRESET_DEVICES[width] ?? (width > 430 ? "Large phone / small tablet" : "Custom width");
}

/**
 * Height of the simulated browser viewport for a given width, so the device keeps a realistic shape
 * instead of just getting wider. Phones show about 1.75:1 of web content (screen minus browser bars);
 * beyond phone widths the ratio eases toward a tablet's.
 */
export function deviceHeightFor(width: number): number {
  const w = Math.max(MIN_VIEWPORT, width);
  const ratio = w <= 430 ? 1.75 : Math.max(1.35, 1.75 - (w - 430) * 0.0024);
  return Math.round(w * ratio);
}

/** Clamp a requested viewport width into the supported mobile range. Non-numbers fall back to the default. */
export function clampViewport(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VIEWPORT;
  return Math.round(Math.min(MAX_VIEWPORT, Math.max(MIN_VIEWPORT, value)));
}

export function clampFullWidth(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VIEWPORT;
  return Math.round(Math.min(MAX_FULL_WIDTH, Math.max(MIN_VIEWPORT, value)));
}

/** Scale that fits `contentWidth` into `available` without ever enlarging. */
export function fitScale(available: number, contentWidth: number, min = 0.3): number {
  if (!Number.isFinite(available) || available <= 0 || contentWidth <= 0) return 1;
  return Math.min(1, Math.max(min, available / contentWidth));
}
