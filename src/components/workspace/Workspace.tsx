"use client";

import { useState } from "react";
import { ScanSearch, ShieldCheck } from "lucide-react";
import { useScreenshotInput } from "@/hooks/useScreenshotInput";
import { useAnalysis } from "@/hooks/useAnalysis";
import { providerLabel, useProviderStatus } from "@/hooks/useProviderStatus";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { AnalysisLoading } from "@/components/results/AnalysisLoading";
import { ResultsView } from "@/components/results/ResultsView";
import { ScreenshotPasteArea } from "./ScreenshotPasteArea";
import { ScreenshotPreview } from "./ScreenshotPreview";

export function Workspace() {
  const { screenshot, error, isProcessing, announcement, clearError, remove } = useScreenshotInput();
  const analysis = useAnalysis(screenshot);
  const providerStatus = useProviderStatus();

  // Replace mode is keyed to the current screenshot, so it resets automatically
  // whenever the screenshot is replaced or removed.
  const [replacingFor, setReplacingFor] = useState<string | null>(null);
  // Whether the user is viewing the analysis flow for the current screenshot.
  const [analysisFor, setAnalysisFor] = useState<string | null>(null);

  const url = screenshot?.previewUrl ?? null;
  const isReplacing = url !== null && replacingFor === url;
  const inAnalysis = url !== null && analysisFor === url;
  const state = analysis.state;

  const startAnalysis = () => {
    if (!screenshot) return;
    setAnalysisFor(screenshot.previewUrl);
    void analysis.start();
  };
  const backToScreenshot = () => {
    analysis.reset();
    setAnalysisFor(null);
  };

  const showResults = inAnalysis && state.status === "success" && screenshot;
  const heroHidden = showResults;

  return (
    <div className="mx-auto w-full max-w-5xl px-(--spacing-gutter) py-(--spacing-section)">
      {!heroHidden && (
        <div className="max-w-2xl">
          <h1 className="text-display font-semibold">Make your desktop tables mobile-friendly.</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            TableShift helps you find better mobile layouts for existing desktop data tables. Paste a
            screenshot of your table to get started.
          </p>
        </div>
      )}

      <div className={`space-y-4 ${heroHidden ? "" : "mt-10"}`}>
        {error && <ErrorMessage error={error} onDismiss={clearError} />}

        {showResults ? (
          <ResultsView
            // Remount (resets corrections) for each new analysis result.
            key={state.runId}
            screenshot={screenshot}
            analysis={state.analysis}
            provider={state.provider}
            onBack={backToScreenshot}
            onRetry={() => void analysis.start()}
          />
        ) : inAnalysis && state.status === "analysing" ? (
          <AnalysisLoading onCancel={backToScreenshot} />
        ) : inAnalysis && state.status === "error" ? (
          <div className="space-y-4">
            <ErrorMessage error={state.failure}>
              {state.failure.retryable && (
                <PrimaryButton variant="secondary" onClick={() => void analysis.start()}>
                  Try again
                </PrimaryButton>
              )}
              <PrimaryButton variant="ghost" onClick={backToScreenshot}>
                Back to screenshot
              </PrimaryButton>
            </ErrorMessage>
          </div>
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
                onClick={startAnalysis}
                icon={<ScanSearch className="size-5" aria-hidden="true" />}
              >
                Analyse screenshot
              </PrimaryButton>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
                {providerStatus?.configured ? (
                  <>
                    Selecting <strong className="font-medium text-ink">Analyse screenshot</strong> sends it
                    to {providerLabel(providerStatus.provider)} ({providerStatus.model}) to read the table.
                    TableShift doesn&rsquo;t store the image and doesn&rsquo;t use it for training.
                  </>
                ) : providerStatus ? (
                  <>
                    AI analysis isn&rsquo;t configured on this server yet ({providerStatus.issue?.replace(/\.$/, "")}) so analysis
                    will fail until it is. Nothing is sent anywhere unless you start an analysis.
                  </>
                ) : (
                  <>Selecting Analyse screenshot sends it to an external AI provider to read the table.</>
                )}
              </p>
            </div>
          </>
        ) : (
          <ScreenshotPasteArea isProcessing={isProcessing} />
        )}

        {!showResults && (
          <p className="flex items-start gap-2 text-sm text-ink-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            Your screenshot is processed only when you start an analysis.
          </p>
        )}
      </div>

      {/* Screen-reader status announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
        {inAnalysis && state.status === "success" ? "Analysis complete." : ""}
      </div>
    </div>
  );
}
