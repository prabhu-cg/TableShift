import type { ScreenshotInput } from "@/types/screenshot";

/** The pasted screenshot, uncropped and undistorted. Controls live beside it (ScreenshotControls). */
export function ScreenshotPreview({ screenshot }: { screenshot: ScreenshotInput }) {
  return (
    <div
      className="max-h-[36rem] overflow-auto rounded-xl bg-surface-muted p-3 sm:p-4"
      tabIndex={0}
      role="region"
      aria-label="Screenshot preview (scrollable)"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL; next/image can't optimise it */}
      <img
        src={screenshot.previewUrl}
        alt={`Pasted table screenshot, ${screenshot.width} by ${screenshot.height} pixels`}
        width={screenshot.width}
        height={screenshot.height}
        className="mx-auto h-auto max-w-full rounded-lg border border-border bg-surface"
      />
    </div>
  );
}
