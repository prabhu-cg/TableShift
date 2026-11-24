import { ClipboardPaste, Table2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";

interface ScreenshotPasteAreaProps {
  isProcessing: boolean;
  /** Compact variant used while replacing an existing screenshot. */
  compact?: boolean;
}

export function ScreenshotPasteArea({ isProcessing, compact = false }: ScreenshotPasteAreaProps) {
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label="Screenshot paste area. Press Control V or Command V to paste a screenshot."
      aria-busy={isProcessing}
      className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-surface-muted text-center transition-colors duration-150 hover:border-primary hover:bg-accent focus-visible:border-primary focus-visible:bg-accent ${
        compact ? "px-6 py-8" : "min-h-72 px-6 py-12 sm:min-h-80"
      }`}
    >
      {isProcessing ? (
        <LoadingIndicator label="Reading screenshot…" />
      ) : compact ? (
        <div className="flex flex-col items-center gap-2">
          <ClipboardPaste className="size-6 text-primary-text" aria-hidden="true" />
          <p className="font-medium text-text">Paste your new screenshot</p>
          <p className="text-text-muted">
            <Keys />
          </p>
        </div>
      ) : (
        <EmptyState
          icon={<Table2 className="size-6" aria-hidden="true" />}
          title="Paste a table screenshot"
          description={
            <>
              <p>
                Copy a screenshot and paste it here using <Keys />.
              </p>
              <p className="mt-1">PNG, JPEG or WebP, up to 10 MB.</p>
            </>
          }
        />
      )}
    </div>
  );
}

const kbd =
  "rounded-md border border-border-strong bg-surface px-1.5 py-0.5 text-[0.8125rem] font-medium text-text";

function Keys() {
  return (
    <>
      <kbd className={kbd}>Ctrl + V</kbd> or <kbd className={kbd}>Cmd + V</kbd>
    </>
  );
}
