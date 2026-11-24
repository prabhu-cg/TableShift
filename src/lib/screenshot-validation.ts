import type { ScreenshotError } from "@/types/screenshot";
import {
  ACCEPTED_MIME_TYPES,
  MAX_DIMENSION_PX,
  MAX_FILE_SIZE_BYTES,
  MIN_DIMENSION_PX,
} from "./screenshot-config";
import { formatFileSize } from "./format";

const isAcceptedType = (t: string): boolean =>
  (ACCEPTED_MIME_TYPES as readonly string[]).includes(t);

export const NO_IMAGE_ERROR: ScreenshotError = {
  code: "no-image",
  title: "No image found in the clipboard",
  message:
    "What you pasted doesn't contain an image. Copy a screenshot (for example with Cmd + Shift + Ctrl + 4 on Mac, or Win + Shift + S on Windows) and try again.",
};

/** Validate type and size before decoding. Returns an error or null. */
export function validateFile(file: File): ScreenshotError | null {
  if (!isAcceptedType(file.type)) {
    const label = file.type || "unknown";
    return {
      code: "unsupported-type",
      title: "That image format isn't supported",
      message: `TableShift accepts PNG, JPEG and WebP screenshots. The pasted image is ${label}.`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      code: "too-large",
      title: "Screenshot is too large",
      message: `The screenshot is ${formatFileSize(file.size)}. The maximum is ${formatFileSize(MAX_FILE_SIZE_BYTES)}. Try capturing a smaller area.`,
    };
  }
  if (file.size === 0) {
    return {
      code: "unreadable",
      title: "The image is empty",
      message: "The pasted image has no data. Try copying the screenshot again.",
    };
  }
  return null;
}

/** Validate decoded dimensions. Returns an error or null. */
export function validateDimensions(width: number, height: number): ScreenshotError | null {
  if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
    return {
      code: "too-small",
      title: "Screenshot is too small",
      message: `The image is ${width} × ${height} px. Each side must be at least ${MIN_DIMENSION_PX} px so the table is legible.`,
    };
  }
  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    return {
      code: "dimensions-too-large",
      title: "Screenshot dimensions are too large",
      message: `The image is ${width} × ${height} px. Each side must be at most ${MAX_DIMENSION_PX} px.`,
    };
  }
  return null;
}

export const UNREADABLE_ERROR: ScreenshotError = {
  code: "unreadable",
  title: "That image couldn't be read",
  message: "The file may be corrupted. Try copying the screenshot again.",
};

/** Decode an object URL to read natural dimensions. */
export function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("decode-failed"));
    img.src = url;
  });
}
