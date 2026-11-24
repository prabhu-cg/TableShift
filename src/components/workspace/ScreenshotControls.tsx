import { RefreshCw, ScanSearch, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { ScreenshotInput } from "@/types/screenshot";
import { ImageMetadata } from "./ImageMetadata";

interface ScreenshotControlsProps {
  screenshot: ScreenshotInput;
  replacing: boolean;
  onReplace: () => void;
  onRemove: () => void;
  onAnalyse: () => void;
  /** Provider / privacy notice shown under the primary action. */
  notice: ReactNode;
}

export function ScreenshotControls({
  screenshot,
  replacing,
  onReplace,
  onRemove,
  onAnalyse,
  notice,
}: ScreenshotControlsProps) {
  return (
    <div className="space-y-5">
      <ImageMetadata screenshot={screenshot} />
      <div className="flex flex-wrap gap-2">
        <PrimaryButton
          variant="secondary"
          size="sm"
          onClick={onReplace}
          aria-pressed={replacing}
          icon={<RefreshCw className="size-4" aria-hidden="true" />}
        >
          Replace screenshot
        </PrimaryButton>
        <PrimaryButton
          variant="ghost"
          size="sm"
          onClick={onRemove}
          icon={<Trash2 className="size-4" aria-hidden="true" />}
        >
          Remove screenshot
        </PrimaryButton>
      </div>
      <div className="border-t border-border pt-5">
        <PrimaryButton
          className="w-full"
          onClick={onAnalyse}
          icon={<ScanSearch className="size-5" aria-hidden="true" />}
        >
          Analyse screenshot
        </PrimaryButton>
        <div className="mt-3 leading-relaxed text-text-muted">{notice}</div>
      </div>
    </div>
  );
}
