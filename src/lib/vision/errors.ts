import type { AnalyseErrorCode } from "@/types/analysis";

/** Error with a user-safe message. Never put provider response bodies or secrets in `message`. */
export class VisionError extends Error {
  constructor(
    public readonly code: AnalyseErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "VisionError";
  }
}

export const STATUS_BY_CODE: Record<AnalyseErrorCode, number> = {
  "invalid-request": 400,
  "invalid-image": 422,
  "unsupported-type": 415,
  "too-large": 413,
  "not-configured": 503,
  "provider-error": 502,
  "rate-limited": 429,
  timeout: 504,
  "invalid-response": 502,
};

/** Map an HTTP failure from a provider to a safe VisionError (body is never read or surfaced). */
export function errorFromProviderStatus(status: number): VisionError {
  if (status === 429)
    return new VisionError(
      "rate-limited",
      "The vision provider is rate limiting requests. Wait a moment and try again.",
      true,
    );
  if (status === 401 || status === 403)
    return new VisionError(
      "provider-error",
      "The vision provider rejected the configured credentials. Check VISION_API_KEY on the server.",
    );
  if (status === 404)
    return new VisionError(
      "provider-error",
      "The vision provider could not find the configured model or endpoint. Check VISION_MODEL and VISION_BASE_URL.",
    );
  if (status === 413 || status === 400)
    return new VisionError(
      "provider-error",
      "The vision provider rejected this request (the image or model settings may be unsupported). Try a smaller or clearer screenshot.",
      true,
    );
  return new VisionError(
    "provider-error",
    "The vision provider had a problem processing the request. Try again shortly.",
    true,
  );
}
