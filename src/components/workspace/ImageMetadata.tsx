import { formatDimensions, formatFileSize } from "@/lib/format";
import type { ScreenshotInput } from "@/types/screenshot";

const TYPE_LABEL: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
};

export function ImageMetadata({ screenshot }: { screenshot: ScreenshotInput }) {
  const items = [
    ["Dimensions", formatDimensions(screenshot.width, screenshot.height)],
    ["File size", formatFileSize(screenshot.size)],
    ["Format", TYPE_LABEL[screenshot.mimeType] ?? screenshot.mimeType],
  ];
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</dt>
          <dd className="mt-0.5 text-[0.9375rem] font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
