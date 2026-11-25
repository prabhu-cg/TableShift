import type { ImageInput, VisionAnalysisProvider, VisionOutput } from "@/types/analysis";
import { VisionError, errorFromProviderStatus } from "./errors";
import { USER_PROMPT, jsonModeSystemPrompt } from "./prompt";
import { parseVisionText } from "./parse";
import { networkError, type ProviderOptions } from "./anthropic-provider";

/**
 * Any OpenAI-compatible Chat Completions endpoint with image input
 * (OpenAI, OpenRouter, Vercel AI Gateway, Azure OpenAI, local servers, …).
 */
export function createOpenAICompatibleProvider({ apiKey, model, baseUrl }: ProviderOptions): VisionAnalysisProvider {
  const endpoint = `${(baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "")}/chat/completions`;
  return {
    name: "openai-compatible",
    model,
    async analyseTable(image: ImageInput, signal?: AbortSignal): Promise<VisionOutput> {
      const dataUrl = `data:${image.mimeType};base64,${Buffer.from(image.data).toString("base64")}`;
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          signal,
          headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            response_format: { type: "json_object" },
            // Groq-hosted reasoning models: skip hidden thinking (it burns the token budget
            // and can truncate the JSON). Extraction needs reading, not reasoning.
            ...(endpoint.includes("api.groq.com") ? { reasoning_effort: "none", max_tokens: 4096 } : {}),
            messages: [
              { role: "system", content: jsonModeSystemPrompt() },
              {
                role: "user",
                content: [
                  { type: "text", text: USER_PROMPT },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
          }),
        });
      } catch (e) {
        throw networkError(e);
      }
      if (!res.ok) throw errorFromProviderStatus(res.status);

      let body: { choices?: { message?: { content?: string | null } }[] };
      try {
        body = await res.json();
      } catch {
        throw new VisionError("invalid-response", "The vision provider returned an unreadable response.", true);
      }
      const text = body.choices?.[0]?.message?.content;
      if (!text) throw new VisionError("invalid-response", "The vision model returned an empty response. Try again.", true);
      return parseVisionText(text);
    },
  };
}
