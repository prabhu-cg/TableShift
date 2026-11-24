/** Limits shared by the client (pre-upload preparation) and the server (validation). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request-body limit
export const UPLOAD_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
/** Longest side the client sends; larger screenshots are downscaled for upload only. */
export const MAX_UPLOAD_DIMENSION = 2400;
export const CLIENT_TIMEOUT_MS = 65_000;
