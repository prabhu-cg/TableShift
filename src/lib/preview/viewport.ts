export const VIEWPORT_PRESETS = [320, 360, 375, 390, 430] as const;
export const DEFAULT_VIEWPORT = 390;
export const MIN_VIEWPORT = 280;
export const MAX_VIEWPORT = 600;
/** Full-width mode follows the available space, within sane bounds. */
export const MAX_FULL_WIDTH = 1024;
/** CSS pixel height of the simulated screen (the content scrolls inside it). */
export const DEVICE_HEIGHT = 680;

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
