"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_VIEWPORT, clampFullWidth, clampViewport, fitScale } from "@/lib/preview/viewport";

/** Shortest simulated screen (CSS px) before the frame is scaled down instead. */
const MIN_SCREEN_HEIGHT = 420;

interface PreviewFrameProps {
  /** The CSS viewport width of the simulated screen (ignored in full-width mode). */
  viewportWidth: number;
  /** Follow the available width instead of a fixed viewport. */
  full?: boolean;
  framed: boolean;
  /** CSS px height of the simulated screen when there is room for it. */
  height: number;
  label: string;
  caption?: boolean;
  /**
   * Fill the parent's height: the screen first gets shorter (down to a floor) and only then is the
   * whole frame scaled, so the preview fits without page scrolling and stays legible.
   */
  fillHeight?: boolean;
  children: (viewportWidth: number) => ReactNode;
}

/**
 * Simulated phone screen. The screen's real CSS width is the viewport width, so layouts respond
 * to it exactly as on a device. A CSS scale() then only shrinks the whole thing to fit its area:
 * scaling never changes the viewport width the layout sees.
 */
export function PreviewFrame({
  viewportWidth,
  full = false,
  framed,
  height,
  label,
  caption = true,
  fillHeight = false,
  children,
}: PreviewFrameProps) {
  const area = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const measure = () => setAvail({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = framed ? 20 : 2;
  const vw = full ? (avail.w > 0 ? clampFullWidth(avail.w - pad) : DEFAULT_VIEWPORT) : clampViewport(viewportWidth);
  const fitH = fillHeight && avail.h > 0;
  const screenH = fitH ? Math.max(MIN_SCREEN_HEIGHT, Math.min(height, avail.h - pad)) : height;
  const totalW = vw + pad;
  const totalH = screenH + pad;
  const widthScale = full ? 1 : fitScale(avail.w, totalW);
  const heightScale = fitH ? Math.min(1, Math.max(0.35, avail.h / totalH)) : 1;
  const scale = Math.min(widthScale, heightScale);

  return (
    <div className={fillHeight ? "flex h-full min-h-0 flex-col" : "w-full"}>
      <div ref={area} className={fillHeight ? "min-h-0 flex-1" : "w-full"}>
        <div style={{ width: totalW * scale, height: totalH * scale, margin: "0 auto" }}>
          <div
            className={framed ? "pv-device" : "pv-plain"}
            style={{ width: totalW, height: totalH, transform: `scale(${scale})`, transformOrigin: "top left" }}
          >
            <div className="pv-screen" style={{ width: vw, height: screenH }}>
              <div
                className="pv pv-viewport"
                style={{ width: vw }}
                role="region"
                tabIndex={0}
                aria-label={`${label}, ${vw} pixels wide`}
              >
                {children(vw)}
              </div>
            </div>
          </div>
        </div>
      </div>
      {caption && (
        <p className="mt-2 shrink-0 text-center text-xs text-text-subtle" aria-live="polite">
          {vw}px viewport{scale < 0.995 ? `, shown at ${Math.round(scale * 100)}%` : ""}
        </p>
      )}
    </div>
  );
}
