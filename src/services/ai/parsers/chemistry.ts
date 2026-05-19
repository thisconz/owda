/**
 * OWDA Chemical Reaction Parsers
 *
 * Handles deep parsing, regex text extraction, and strict validation
 * for chemical reaction payloads streaming from various AI providers.
 */

import { ChemistryAnalysisSchema, type ChemistryAnalysisPayload } from "./validation";

/**
 * Safely extracts, cleans, and validates a chemical analysis payload from raw model text.
 * Handles messy markdown backticks, trailing/leading whitespace, and missing fields gracefully.
 * 
 * @param rawResponse The raw string response emitted by the AI provider
 * @returns Fully validated ChemistryAnalysisPayload adhering to anti-null structural patterns
 */
export function parseChemistryResponse(rawResponse: string): ChemistryAnalysisPayload {
  if (!rawResponse || typeof rawResponse !== "string") {
    throw new Error("Cannot parse empty or non-string AI response.");
  }

  // Strip Markdown JSON code blocks if present
  let cleaned = rawResponse.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    // Fallback attempt: Try to isolate JSON object boundaries if additional conversational text exists
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error(`AI model returned structurally malformed JSON content.`);
      }
    } else {
      throw new Error(`AI model response did not contain a valid JSON payload.`);
    }
  }

  // Handle potential null values that might break the application's anti-null paradigm
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    
    // Explicitly transition nulls or invalid thermodynamic entries to undefined
    if (obj.enthalpy === null || Number.isNaN(obj.enthalpy)) obj.enthalpy = undefined;
    if (obj.entropy === null || Number.isNaN(obj.entropy)) obj.entropy = undefined;
    if (obj.gibbs === null || Number.isNaN(obj.gibbs)) obj.gibbs = undefined;
  }

  // Execute modern Zod v4 validation pipeline
  return ChemistryAnalysisSchema.parse(parsed);
}