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
    <dl className="divide-y divide-border rounded-xl border border-border">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
          <dt className="text-text-subtle">{label}</dt>
          <dd className="font-medium tabular-nums text-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
