/** A validated screenshot held in memory. This is the input contract for future analysis (V1.1). */
export interface ScreenshotInput {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
}

export type ScreenshotErrorCode =
  | "no-image"
  | "unsupported-type"
  | "too-large"
  | "too-small"
  | "dimensions-too-large"
  | "unreadable";

export interface ScreenshotError {
  code: ScreenshotErrorCode;
  title: string;
  message: string;
}

/** High-level workspace phase. V1.1 will add `analysing` / `results`. */
export type WorkspacePhase = "input" | "analysis-pending";
