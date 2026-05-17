/**
 * OWDA AI Response Validation
 *
 * Runtime Zod validators for all AI response shapes.
 * Centralizing validation here means parsers stay thin and
 * schemas can be reused across providers.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared field validators
// ---------------------------------------------------------------------------

/** Finite number validator — rejects NaN, Infinity, and null */
const finiteNumber = z
  .number()
  .finite()
  .refine((n) => !Number.isNaN(n), { message: "Value must not be NaN" });

/** Thermodynamic value — optional finite number */
const thermoValue = finiteNumber.optional();

// ---------------------------------------------------------------------------
// Chemistry analysis schema
// ---------------------------------------------------------------------------

export const ReactionTypeValues = [
  "Synthesis",
  "Decomposition",
  "Combustion",
  "Single Replacement",
  "Double Replacement",
  "Acid-Base",
  "Redox",
  "Electrophilic Aromatic Substitution",
  "Nucleophilic Addition",
  "Polymerisation",
  "Photolysis",
  "Unknown",
] as const;

export const ReactionTypeSchema = z.enum(ReactionTypeValues);
export type ReactionType = z.infer<typeof ReactionTypeSchema>;

/**
 * Zod schema for the full chemistry analysis payload returned by AI models.
 * This is the single validation boundary — everything inside the app trusts
 * values that passed this schema.
 */
export const ChemistryAnalysisSchema = z.object({
  /** Plain-English overview of the reaction */
  overview: z.string().min(10, "Overview is too short").max(2000),

  /** Technical mechanistic explanation */
  mechanism: z.string().min(10, "Mechanism is too short").max(4000),

  /** Reaction classification */
  reactionType: ReactionTypeSchema.catch("Unknown"),

  /**
   * Standard enthalpy ΔH° in kJ/mol at 298 K.
   * Negative = exothermic. Omitted when model cannot estimate.
   */
  enthalpy: thermoValue,

  /**
   * Standard entropy ΔS° in J/(mol·K) at 298 K.
   * Omitted when model cannot estimate.
   */
  entropy: thermoValue,

  /**
   * Standard Gibbs free energy ΔG° in kJ/mol at 298 K.
   * Negative = spontaneous. Omitted when model cannot estimate.
   */
  gibbs: thermoValue,
});

export type ChemistryAnalysisPayload = z.infer<typeof ChemistryAnalysisSchema>;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validates a parsed JSON object against the chemistry analysis schema.
 * Returns a discriminated union { success: true, data } | { success: false, error }.
 */
export function validateChemistryAnalysis(
  input: unknown,
): z.SafeParseReturnType<ChemistryAnalysisPayload, ChemistryAnalysisPayload> {
  return ChemistryAnalysisSchema.safeParse(input);
}

/**
 * Validates and throws on failure with a clear diagnostic message.
 * Use in orchestration code where a thrown error is appropriate.
 */
export function assertChemistryAnalysis(
  input: unknown,
): ChemistryAnalysisPayload {
  const result = ChemistryAnalysisSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`AI response failed schema validation:\n${issues}`);
  }
  return result.data;
}