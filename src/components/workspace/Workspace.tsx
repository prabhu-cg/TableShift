"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useScreenshotInput } from "@/hooks/useScreenshotInput";
import { useAnalysis } from "@/hooks/useAnalysis";
import { providerLabel, useProviderStatus } from "@/hooks/useProviderStatus";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { InfoPanel } from "@/components/ui/InfoPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { AnalysisLoading } from "@/components/results/AnalysisLoading";
import { ResultsView } from "@/components/results/ResultsView";
import { ScreenshotPasteArea } from "./ScreenshotPasteArea";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { ScreenshotControls } from "./ScreenshotControls";

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

  const showResults = inAnalysis && state.status === "success" && !!screenshot;

  const notice = providerStatus?.configured ? (
    <p>
      Selecting <strong className="font-medium text-text">Analyse screenshot</strong> sends it to{" "}
      {providerLabel(providerStatus.provider)} ({providerStatus.model}) to read the table. TableShift
      doesn&rsquo;t store the image and doesn&rsquo;t use it for training.
    </p>
  ) : providerStatus ? (
    <InfoPanel tone="warning" title="AI analysis isn’t set up on this server yet">
      <p>
        {providerStatus.issue?.replace(/\.$/, "")}. Analysis will fail until it is configured. Nothing is
        sent anywhere unless you start an analysis.
      </p>
    </InfoPanel>
  ) : (
    <p>Selecting Analyse screenshot sends it to an external AI provider to read the table.</p>
  );

  return (
    <div className={`mx-auto w-full max-w-6xl px-(--spacing-gutter) ${showResults ? "py-4 sm:py-5" : "py-(--spacing-section)"}`}>
      {!showResults && (
        <div className="mb-8 max-w-3xl sm:mb-10">
          <h1 className="text-4xl leading-[1.05] text-text sm:text-6xl">
            Make your desktop tables <span className="text-primary-text">mobile-friendly.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-muted">
            TableShift helps you find better mobile layouts for existing desktop data tables. Paste a
            screenshot of your table to get started.
          </p>
        </div>
      )}

      <div className={`space-y-4 rounded-panel border border-border bg-surface ${showResults ? "p-4 sm:p-5" : "p-5 sm:p-8"}`}>
        {error && <ErrorMessage error={error} onDismiss={clearError} />}

        {showResults && screenshot && state.status === "success" ? (
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
          <ErrorMessage error={state.failure}>
            {state.failure.retryable && (
              <PrimaryButton variant="secondary" size="sm" onClick={() => void analysis.start()}>
                Try again
              </PrimaryButton>
            )}
            <PrimaryButton variant="ghost" size="sm" onClick={backToScreenshot}>
              Back to screenshot
            </PrimaryButton>
          </ErrorMessage>
        ) : screenshot ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-8">
            <div className="space-y-4">
              {isReplacing && <ScreenshotPasteArea isProcessing={isProcessing} compact />}
              <ScreenshotPreview screenshot={screenshot} />
            </div>
            <ScreenshotControls
              screenshot={screenshot}
              replacing={isReplacing}
              onReplace={() => setReplacingFor(isReplacing ? null : screenshot.previewUrl)}
              onRemove={remove}
              onAnalyse={startAnalysis}
              notice={notice}
            />
          </div>
        ) : (
          <ScreenshotPasteArea isProcessing={isProcessing} />
        )}

        {!showResults && (
          <p className="flex items-start gap-2 pt-2 text-text-muted">
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
