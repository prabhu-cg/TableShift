import "server-only";
import type { ProviderStatus, VisionAnalysisProvider } from "@/types/analysis";
import { createAnthropicProvider } from "./anthropic-provider";
import { createOpenAICompatibleProvider } from "./openai-compatible-provider";

const PROVIDERS = ["anthropic", "openai-compatible"] as const;
type ProviderKind = (typeof PROVIDERS)[number];

export const DEFAULT_TIMEOUT_MS = 55_000;

interface ResolvedConfig {
  kind: ProviderKind;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

function resolve(): { config: ResolvedConfig } | { issue: string } {
  const kind = process.env.VISION_PROVIDER?.trim().toLowerCase();
  if (!kind) return { issue: "VISION_PROVIDER is not set." };
  if (!(PROVIDERS as readonly string[]).includes(kind))
    return { issue: `VISION_PROVIDER must be one of: ${PROVIDERS.join(", ")}.` };
  const apiKey = process.env.VISION_API_KEY?.trim();
  if (!apiKey) return { issue: "VISION_API_KEY is not set." };
  const model = process.env.VISION_MODEL?.trim();
  if (!model) return { issue: "VISION_MODEL is not set." };
  const baseUrl = process.env.VISION_BASE_URL?.trim() || undefined;
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) return { issue: "VISION_BASE_URL must start with http:// or https://." };
  return { config: { kind: kind as ProviderKind, apiKey, model, baseUrl } };
}

/** Provider status for the UI. Never includes the key or base URL. */
export function getProviderStatus(): ProviderStatus {
  const r = resolve();
  if ("issue" in r) return { configured: false, provider: null, model: null, issue: r.issue };
  return { configured: true, provider: r.config.kind, model: r.config.model, issue: null };
}

/** Returns the configured provider, or null when configuration is missing/invalid. */
export function getProvider(): VisionAnalysisProvider | null {
  const r = resolve();
  if ("issue" in r) return null;
  const { kind, ...opts } = r.config;
  return kind === "anthropic" ? createAnthropicProvider(opts) : createOpenAICompatibleProvider(opts);
}

export function getTimeoutMs(): number {
  const n = Number(process.env.VISION_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 5_000 && n <= 120_000 ? n : DEFAULT_TIMEOUT_MS;
}
