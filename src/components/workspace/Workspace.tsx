"use client";

import { useState } from "react";
import { ScanSearch, ShieldCheck } from "lucide-react";
import { useScreenshotInput } from "@/hooks/useScreenshotInput";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenshotPasteArea } from "./ScreenshotPasteArea";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { AnalysisPlaceholder } from "./AnalysisPlaceholder";

export function Workspace() {
  const { screenshot, error, isProcessing, announcement, clearError, remove } =
    useScreenshotInput();

  // Both UI modes are keyed to the current screenshot, so they reset automatically
  // whenever the screenshot is replaced or removed.
  const [replacingFor, setReplacingFor] = useState<string | null>(null);
  const [analysisFor, setAnalysisFor] = useState<string | null>(null);

  const url = screenshot?.previewUrl ?? null;
  const isReplacing = url !== null && replacingFor === url;
  const showAnalysis = url !== null && analysisFor === url;

  return (
    <div className="mx-auto w-full max-w-5xl px-(--spacing-gutter) py-(--spacing-section)">
      <div className="max-w-2xl">
        <h1 className="text-display font-semibold">Make your desktop tables mobile-friendly.</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          TableShift helps you find better mobile layouts for existing desktop data tables. Paste a
          screenshot of your table to get started.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {error && <ErrorMessage error={error} onDismiss={clearError} />}

        {showAnalysis ? (
          <AnalysisPlaceholder onBack={() => setAnalysisFor(null)} />
        ) : screenshot ? (
          <>
            {isReplacing && <ScreenshotPasteArea isProcessing={isProcessing} compact />}
            <ScreenshotPreview
              screenshot={screenshot}
              replacing={isReplacing}
              onReplace={() => setReplacingFor(isReplacing ? null : screenshot.previewUrl)}
              onRemove={remove}
            />
            <div className="pt-2">
              <PrimaryButton
                className="w-full sm:w-auto sm:min-w-56"
                onClick={() => setAnalysisFor(screenshot.previewUrl)}
                icon={<ScanSearch className="size-5" aria-hidden="true" />}
              >
                Analyse screenshot
              </PrimaryButton>
            </div>
          </>
        ) : (
          <ScreenshotPasteArea isProcessing={isProcessing} />
        )}

        <p className="flex items-start gap-2 text-sm text-ink-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          Your screenshot is processed only when you start an analysis.
        </p>
      </div>

      {/* Screen-reader status announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
