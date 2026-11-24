import { NextResponse } from "next/server";
import type { AnalyseErrorCode, AnalyseResponse } from "@/types/analysis";
import { MAX_UPLOAD_BYTES, UPLOAD_MIME_TYPES } from "@/lib/analyse-config";
import { sniffImageType } from "@/lib/image-sniff";
import { getProvider, getTimeoutMs } from "@/lib/vision/config";
import { STATUS_BY_CODE, VisionError } from "@/lib/vision/errors";
import { toTableAnalysis } from "@/lib/vision/parse";

export const maxDuration = 60;

function fail(code: AnalyseErrorCode, message: string, retryable = false) {
  const body: AnalyseResponse = { ok: false, error: { code, message, retryable } };
  return NextResponse.json(body, {
    status: STATUS_BY_CODE[code],
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Analyses one screenshot. The image lives only in this request's memory:
 * it is never written to disk, stored, or logged.
 */
export async function POST(request: Request) {
  const provider = getProvider();
  if (!provider)
    return fail(
      "not-configured",
      "AI analysis isn't configured on this server. Set the VISION_* environment variables and restart.",
    );

  // Cheap early rejection before buffering the body (multipart adds a little overhead).
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES + 64 * 1024)
    return fail("too-large", "The screenshot is too large to analyse. Try a smaller capture area.");

  let file: File;
  try {
    const form = await request.formData();
    const entry = form.get("image");
    if (!(entry instanceof File)) return fail("invalid-request", "No image was provided.");
    file = entry;
  } catch {
    return fail("invalid-request", "The request couldn't be read. Try again.");
  }

  if (!(UPLOAD_MIME_TYPES as readonly string[]).includes(file.type))
    return fail("unsupported-type", "Only PNG, JPEG and WebP screenshots can be analysed.");
  if (file.size === 0) return fail("invalid-image", "The screenshot is empty.");
  if (file.size > MAX_UPLOAD_BYTES)
    return fail("too-large", "The screenshot is too large to analyse. Try a smaller capture area.");

  const data = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(data);
  if (!sniffed) return fail("invalid-image", "That file isn't a valid PNG, JPEG or WebP image.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getTimeoutMs());
  try {
    const output = await provider.analyseTable({ data, mimeType: sniffed }, controller.signal);
    const body: AnalyseResponse = {
      ok: true,
      analysis: toTableAnalysis(output),
      provider: { name: provider.name, model: provider.model },
    };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof VisionError) {
      console.error(`[analyse] failed: ${e.code}`); // code only; never image or provider payloads
      return fail(e.code, e.message, e.retryable);
    }
    if (controller.signal.aborted)
      return fail("timeout", "The analysis took too long and was stopped. Try again.", true);
    console.error("[analyse] failed: unexpected");
    return fail("provider-error", "Something went wrong while analysing the screenshot. Try again.", true);
  } finally {
    clearTimeout(timer);
  }
}
