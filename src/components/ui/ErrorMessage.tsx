import type { ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorMessageProps {
  error: { title: string; message: string };
  onDismiss?: () => void;
  /** Action buttons (e.g. Retry) shown below the message. */
  children?: ReactNode;
}

export function ErrorMessage({ error, onDismiss, children }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-surface p-4"
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-danger">{error.title}</p>
        <p className="mt-1 leading-relaxed text-text">{error.message}</p>
        {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="-m-1 rounded-full p-2 text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
