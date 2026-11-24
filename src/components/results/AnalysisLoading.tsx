import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function AnalysisLoading({ onCancel }: { onCancel: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-panel border border-line bg-surface px-6 py-12 text-center"
    >
      <LoadingIndicator label="Analysing your screenshot…" />
      <p className="max-w-md text-sm leading-relaxed text-ink-muted">
        Your screenshot has been sent to the configured AI provider to read the table. This usually takes
        10–30 seconds.
      </p>
      <PrimaryButton variant="secondary" onClick={onCancel}>
        Cancel
      </PrimaryButton>
    </div>
  );
}
