import { ClaudeAnalysisSchema } from "../schemas/analysis";

export function parseAIResponse(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Model returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  return ClaudeAnalysisSchema.parse(parsed);
}
