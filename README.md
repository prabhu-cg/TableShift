# TableShift

**Make desktop data work on mobile.** Paste a screenshot of a desktop data table and get the three mobile layout patterns that fit it best, with the reasoning.

## Run

```bash
npm install
cp .env.example .env.local   # then fill in the VISION_* values
npm run dev                  # http://localhost:3000
npm test                     # engine, parsing and assessment tests
npm run build
```

## Vision provider (server-side only)

Analysis needs a vision-capable model. Configure it with environment variables; the key never reaches the browser.

| Variable | Description |
| --- | --- |
| `VISION_PROVIDER` | `anthropic` or `openai-compatible` |
| `VISION_API_KEY` | Provider API key |
| `VISION_MODEL` | A vision-capable model id for that provider |
| `VISION_BASE_URL` | Optional for `anthropic`. For `openai-compatible`, defaults to OpenAI; set it for OpenRouter, Vercel AI Gateway, Azure, local servers, etc. |
| `VISION_TIMEOUT_MS` | Optional, 5000–120000 (default 55000) |

Without these the app still runs; Analyse reports that AI analysis isn't configured. `GET /api/analyse/status` reports configuration state without secrets.

## Architecture

- **Layer A: vision** (`src/lib/vision`): provider adapters behind `VisionAnalysisProvider`; output validated with Zod; text sanitised; screenshot content treated as untrusted data.
- **Layer B: recommendations** (`src/lib/recommendation`): deterministic rules and weighted scoring over the analysis. The AI never supplies scores or rankings.
- `POST /api/analyse` validates, analyses in memory and returns JSON. Images are never stored or logged.
