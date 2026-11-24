import { RefreshCw, Trash2 } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { ScreenshotInput } from "@/types/screenshot";
import { ImageMetadata } from "./ImageMetadata";

interface ScreenshotPreviewProps {
  screenshot: ScreenshotInput;
  onReplace: () => void;
  onRemove: () => void;
  replacing: boolean;
}

export function ScreenshotPreview({
  screenshot,
  onReplace,
  onRemove,
  replacing,
}: ScreenshotPreviewProps) {
  return (
    <figure className="overflow-hidden rounded-panel border border-line bg-canvas shadow-card">
      <div
        className="max-h-[32rem] overflow-auto bg-surface p-3 sm:p-5"
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
          className="mx-auto h-auto max-w-full rounded-control border border-line bg-white"
        />
      </div>
      <figcaption className="flex flex-col gap-4 border-t border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <ImageMetadata screenshot={screenshot} />
        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            variant="secondary"
            onClick={onReplace}
            aria-pressed={replacing}
            icon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Replace screenshot
          </PrimaryButton>
          <PrimaryButton
            variant="ghost"
            onClick={onRemove}
            icon={<Trash2 className="size-4" aria-hidden="true" />}
          >
            Remove screenshot
          </PrimaryButton>
        </div>
      </figcaption>
    </figure>
  );
}
