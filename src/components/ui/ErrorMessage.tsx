import { AlertCircle, X } from "lucide-react";
import type { ScreenshotError } from "@/types/screenshot";

interface ErrorMessageProps {
  error: ScreenshotError;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-card border border-error/30 bg-error-soft p-4"
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-error-ink" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-semibold text-error-ink">{error.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink">{error.message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="-m-1 rounded-control p-2 text-ink-muted hover:bg-white hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
