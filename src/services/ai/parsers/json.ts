import { ChemistryAnalysisSchema } from "./validation";

/**
 * Parses a raw AI text string, safely strips markdown code block wrappers,
 * evaluates JSON structural validity, and enforces Zod v4 validation schemas.
 */
export function parseAIResponse(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Model returned invalid JSON: ${cleaned.slice(0, 200)}...`);
  }

  // Uses Zod v4 strict validation pipeline
  return ChemistryAnalysisSchema.parse(parsed);
}