export type ClipboardExtraction =
  | { kind: "image"; file: File }
  | { kind: "none" };

/**
 * Pull the first image out of a paste event's clipboard data.
 * Uses the actual clipboard items (no permission prompt required).
 * Any `image/*` item is returned so unsupported formats (gif, svg, bmp…)
 * can be rejected with a specific message by the validator.
 */
export function extractImageFromClipboard(data: DataTransfer | null): ClipboardExtraction {
  if (!data) return { kind: "none" };

  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return { kind: "image", file };
    }
  }
  // Fallback for browsers that only populate `files`.
  for (const file of Array.from(data.files ?? [])) {
    if (file.type.startsWith("image/")) return { kind: "image", file };
  }
  return { kind: "none" };
}
