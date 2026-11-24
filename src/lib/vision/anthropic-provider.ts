import type { ImageInput, VisionAnalysisProvider, VisionOutput } from "@/types/analysis";
import { VisionError, errorFromProviderStatus } from "./errors";
import { SYSTEM_PROMPT, TOOL_NAME, USER_PROMPT, outputJsonSchema } from "./prompt";
import { validateVisionOutput } from "./parse";

export interface ProviderOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

/** Anthropic Messages API, using forced tool use for structured output. */
export function createAnthropicProvider({ apiKey, model, baseUrl }: ProviderOptions): VisionAnalysisProvider {
  const endpoint = `${(baseUrl || "https://api.anthropic.com").replace(/\/+$/, "")}/v1/messages`;
  return {
    name: "anthropic",
    model,
    async analyseTable(image: ImageInput, signal?: AbortSignal): Promise<VisionOutput> {
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 8192,
            system: SYSTEM_PROMPT,
            tools: [
              {
                name: TOOL_NAME,
                description: "Report the structure of the table visible in the screenshot.",
                input_schema: outputJsonSchema(),
              },
            ],
            tool_choice: { type: "tool", name: TOOL_NAME },
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: image.mimeType,
                      data: Buffer.from(image.data).toString("base64"),
                    },
                  },
                  { type: "text", text: USER_PROMPT },
                ],
              },
            ],
          }),
        });
      } catch (e) {
        throw networkError(e);
      }
      if (!res.ok) throw errorFromProviderStatus(res.status);

      let body: { content?: { type: string; input?: unknown }[] };
      try {
        body = await res.json();
      } catch {
        throw new VisionError("invalid-response", "The vision provider returned an unreadable response.", true);
      }
      const block = body.content?.find((b) => b.type === "tool_use");
      if (!block) throw new VisionError("invalid-response", "The vision model did not return structured output. Try again.", true);
      return validateVisionOutput(block.input);
    },
  };
}

export function networkError(e: unknown): VisionError {
  if (e instanceof DOMException && (e.name === "AbortError" || e.name === "TimeoutError"))
    return new VisionError("timeout", "The analysis took too long and was stopped. Try again.", true);
  return new VisionError("provider-error", "Couldn't reach the vision provider. Check the server's network and VISION_BASE_URL.", true);
}
