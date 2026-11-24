"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyseErrorCode, AnalyseResponse, TableAnalysis } from "@/types/analysis";
import type { ScreenshotInput } from "@/types/screenshot";
import { CLIENT_TIMEOUT_MS } from "@/lib/analyse-config";
import { PrepareImageError, prepareImageForUpload } from "@/lib/prepare-image";

export interface AnalysisFailure {
  code: AnalyseErrorCode | "network" | "prepare";
  title: string;
  message: string;
  retryable: boolean;
}

export type AnalysisState =
  | { status: "idle" }
  | { status: "analysing" }
  | { status: "success"; runId: number; analysis: TableAnalysis; provider: { name: string; model: string } }
  | { status: "error"; failure: AnalysisFailure };

const TITLES: Record<string, string> = {
  "not-configured": "AI analysis isn't configured",
  "rate-limited": "The AI provider is busy",
  timeout: "The analysis timed out",
  "invalid-response": "The AI returned an unusable result",
  "provider-error": "The AI provider reported a problem",
  "invalid-image": "That screenshot can't be analysed",
  "unsupported-type": "That screenshot format isn't supported",
  "too-large": "The screenshot is too large to analyse",
  "invalid-request": "The request was invalid",
  network: "Couldn't reach TableShift's server",
  prepare: "The screenshot couldn't be prepared",
};

const failure = (code: AnalysisFailure["code"], message: string, retryable: boolean): AnalysisFailure => ({
  code,
  title: TITLES[code] ?? "Analysis failed",
  message,
  retryable,
});

/**
 * Runs analysis for the current screenshot. State is keyed to the screenshot, so
 * replacing or removing it resets analysis automatically and cancels in-flight work.
 */
export function useAnalysis(screenshot: ScreenshotInput | null) {
  const [result, setResult] = useState<{ key: string; state: AnalysisState } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runCounter = useRef(0);
  const key = screenshot?.previewUrl ?? null;

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // Cancel in-flight analysis when the screenshot changes or the component unmounts.
  useEffect(() => cancel, [key, cancel]);

  const start = useCallback(async () => {
    if (!screenshot) return;
    cancel();
    const controller = new AbortController();
    abortRef.current = controller;
    const k = screenshot.previewUrl;
    const set = (state: AnalysisState) => {
      if (abortRef.current === controller) setResult({ key: k, state });
    };
    set({ status: "analysing" });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    try {
      const upload = await prepareImageForUpload(screenshot.file, screenshot.width, screenshot.height);
      const form = new FormData();
      form.append("image", upload);
      const res = await fetch("/api/analyse", { method: "POST", body: form, signal: controller.signal });
      let body: AnalyseResponse | null = null;
      try {
        body = (await res.json()) as AnalyseResponse;
      } catch {
        /* non-JSON response (e.g. platform error page) */
      }
      if (body?.ok) set({ status: "success", runId: ++runCounter.current, analysis: body.analysis, provider: body.provider });
      else if (body && !body.ok)
        set({ status: "error", failure: failure(body.error.code, body.error.message, body.error.retryable) });
      else
        set({
          status: "error",
          failure: failure(
            res.status === 413 ? "too-large" : "provider-error",
            res.status === 413
              ? "The screenshot is too large to analyse. Try a smaller capture area."
              : "The server returned an unexpected response. Try again.",
            res.status !== 413,
          ),
        });
    } catch (e) {
      if (abortRef.current !== controller) return; // cancelled on purpose
      if (timedOut || (e instanceof DOMException && e.name === "AbortError"))
        set({ status: "error", failure: failure("timeout", "The analysis took too long and was stopped. Try again.", true) });
      else if (e instanceof PrepareImageError)
        set({ status: "error", failure: failure("prepare", e.message, false) });
      else
        set({ status: "error", failure: failure("network", "Check your connection and try again.", true) });
    } finally {
      clearTimeout(timer);
    }
  }, [screenshot, cancel]);

  const reset = useCallback(() => {
    cancel();
    setResult(null);
  }, [cancel]);

  const state: AnalysisState = result && result.key === key ? result.state : { status: "idle" };
  return { state, start, cancel, reset };
}
