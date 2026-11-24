"use client";

import { useEffect, useState } from "react";
import type { ProviderStatus } from "@/types/analysis";

/** Reads whether a vision provider is configured (never any secrets). `null` while loading/unknown. */
export function useProviderStatus(): ProviderStatus | null {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/analyse/status", { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<ProviderStatus>) : null))
      .then((s) => s && setStatus(s))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return status;
}

export function providerLabel(provider: string | null): string {
  if (provider === "anthropic") return "Anthropic";
  if (provider === "openai-compatible") return "an OpenAI-compatible provider";
  return "an external AI provider";
}
