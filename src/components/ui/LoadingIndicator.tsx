import { Loader2 } from "lucide-react";

export function LoadingIndicator({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-text-muted">
      <Loader2 className="size-4 animate-spin text-primary-text" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
