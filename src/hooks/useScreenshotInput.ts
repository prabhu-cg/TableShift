"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScreenshotError, ScreenshotInput } from "@/types/screenshot";
import { extractImageFromClipboard } from "@/lib/clipboard";
import {
  NO_IMAGE_ERROR,
  UNREADABLE_ERROR,
  loadImageDimensions,
  validateDimensions,
  validateFile,
} from "@/lib/screenshot-validation";

interface UseScreenshotInput {
  screenshot: ScreenshotInput | null;
  error: ScreenshotError | null;
  isProcessing: boolean;
  /** Polite status text for screen readers. */
  announcement: string;
  clearError: () => void;
  remove: () => void;
  /** Validate and accept an image file (also used by paste). */
  acceptFile: (file: File) => Promise<void>;
}

/**
 * Owns the single in-memory screenshot, its object URL lifecycle, and the
 * document-level paste listener. Nothing is persisted or uploaded.
 */
export function useScreenshotInput(): UseScreenshotInput {
  const [screenshot, setScreenshot] = useState<ScreenshotInput | null>(null);
  const [error, setError] = useState<ScreenshotError | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const urlRef = useRef<string | null>(null); // the URL currently owned by `screenshot`
  const requestRef = useRef(0); // guards against out-of-order async results

  const revokeCurrent = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const fail = useCallback((e: ScreenshotError) => {
    setError(e);
    setAnnouncement(`Error: ${e.title}. ${e.message}`);
  }, []);

  const acceptFile = useCallback(
    async (file: File) => {
      const id = ++requestRef.current;
      setError(null);

      const fileError = validateFile(file);
      if (fileError) return fail(fileError);

      setIsProcessing(true);
      setAnnouncement("Reading screenshot…");
      const url = URL.createObjectURL(file);
      try {
        const { width, height } = await loadImageDimensions(url);
        if (id !== requestRef.current) {
          URL.revokeObjectURL(url); // superseded by a newer paste
          return;
        }
        const dimError = validateDimensions(width, height);
        if (dimError) {
          URL.revokeObjectURL(url);
          setIsProcessing(false);
          return fail(dimError);
        }
        revokeCurrent(); // release the previous screenshot only once the new one is good
        urlRef.current = url;
        setScreenshot({
          file,
          previewUrl: url,
          width,
          height,
          size: file.size,
          mimeType: file.type,
        });
        setAnnouncement(`Screenshot added, ${width} by ${height} pixels.`);
        setIsProcessing(false);
      } catch {
        URL.revokeObjectURL(url);
        if (id !== requestRef.current) return;
        setIsProcessing(false);
        fail(UNREADABLE_ERROR);
      }
    },
    [fail, revokeCurrent],
  );

  const remove = useCallback(() => {
    requestRef.current++;
    revokeCurrent();
    setScreenshot(null);
    setError(null);
    setIsProcessing(false);
    setAnnouncement("Screenshot removed.");
  }, [revokeCurrent]);

  const clearError = useCallback(() => setError(null), []);

  // Document-level paste: works anywhere on the page, no clipboard permission needed.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;

      const result = extractImageFromClipboard(event.clipboardData);
      event.preventDefault(); // never let a paste trigger navigation or stray insertion
      if (result.kind === "image") void acceptFile(result.file);
      else fail(NO_IMAGE_ERROR);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [acceptFile, fail]);

  // Stop the browser from navigating to a file dropped outside the paste area.
  useEffect(() => {
    const block = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  // Release the object URL on unmount.
  useEffect(() => revokeCurrent, [revokeCurrent]);

  return { screenshot, error, isProcessing, announcement, clearError, remove, acceptFile };
}
