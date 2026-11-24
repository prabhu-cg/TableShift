import type { TableAnalysis, VisionOutput } from "@/types/analysis";
import { UNREADABLE, visionOutputSchema } from "@/types/analysis";
import { deriveFeatures } from "../features";
import { VisionError } from "./errors";

const MAX_STRING = 300;

// Control (Cc) and invisible/bidi format (Cf) characters.
const INVISIBLE_CHARS = /[\p{Cc}\p{Cf}]/gu;

/** Strip control/bidi characters and clamp length. Content is only ever rendered as text. */
function sanitiseDeep(value: unknown): unknown {
  if (typeof value === "string")
    return value.replace(/\s+/g, " ").replace(INVISIBLE_CHARS, "").trim().slice(0, MAX_STRING);
  if (Array.isArray(value)) return value.map(sanitiseDeep);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k.slice(0, 60), sanitiseDeep(v)]),
    );
  return value;
}

/** Pull a JSON object out of model text (tolerates code fences or surrounding prose). */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no-json");
  return JSON.parse(candidate.slice(start, end + 1));
}

const INVALID = () =>
  new VisionError(
    "invalid-response",
    "The vision model returned a response TableShift couldn't validate. Try again, or use a clearer screenshot.",
    true,
  );

/** Validate raw model output (parsed JSON) against the strict schema. */
export function validateVisionOutput(raw: unknown): VisionOutput {
  const result = visionOutputSchema.safeParse(sanitiseDeep(raw));
  if (!result.success) throw INVALID();
  return result.data;
}

export function parseVisionText(text: string): VisionOutput {
  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch {
    throw INVALID();
  }
  return validateVisionOutput(raw);
}

/**
 * Normalise validated model output into a TableAnalysis:
 * stable ids, rows keyed only by known columns, samples taken only from real extracted
 * values, and features derived deterministically. Nothing is invented.
 */
export function toTableAnalysis(out: VisionOutput): TableAnalysis {
  const idMap = new Map<string, string>();
  const columns = out.columns.map((c, i) => {
    const id = `col-${i + 1}`;
    if (!idMap.has(c.id)) idMap.set(c.id, id);
    return { ...c, id };
  });

  const rows = out.rows.map((r, i) => {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(r.values)) {
      const id = idMap.get(key);
      if (id) values[id] = value;
    }
    return { id: `row-${i + 1}`, values };
  });

  for (const c of columns) {
    const samples = c.sampleValues.filter((v) => v && v !== UNREADABLE);
    c.sampleValues = samples.length
      ? samples.slice(0, 4)
      : rows
          .map((r) => r.values[c.id])
          .filter((v): v is string => !!v && v !== UNREADABLE)
          .slice(0, 4);
  }

  return {
    contentKind: out.contentKind,
    ambiguousMultipleTables: out.ambiguousMultipleTables,
    tableDetected: out.tableDetected,
    confidence: out.confidence,
    columns,
    rows,
    actions: out.actions,
    features: deriveFeatures(columns, rows, out.actions),
    observations: out.observations,
    warnings: out.warnings,
  };
}
