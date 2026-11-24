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
      className={`flex w-full flex-col items-center justify-center rounded-panel border-2 border-dashed border-line-strong bg-surface text-center transition-colors hover:border-accent focus-visible:border-accent ${
        compact ? "px-6 py-8" : "min-h-72 px-6 py-12 sm:min-h-80"
      }`}
    >
      {isProcessing ? (
        <LoadingIndicator label="Reading screenshot…" />
      ) : compact ? (
        <div className="flex flex-col items-center gap-2">
          <ClipboardPaste className="size-6 text-accent-ink" aria-hidden="true" />
          <p className="font-medium">Paste your new screenshot</p>
          <p className="text-sm text-ink-muted">
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

function Keys() {
  return (
    <>
      <kbd className="rounded border border-line-strong bg-canvas px-1.5 py-0.5 font-sans text-[0.8125rem] font-medium text-ink">
        Ctrl + V
      </kbd>{" "}
      or{" "}
      <kbd className="rounded border border-line-strong bg-canvas px-1.5 py-0.5 font-sans text-[0.8125rem] font-medium text-ink">
        Cmd + V
      </kbd>
    </>
  );
}
