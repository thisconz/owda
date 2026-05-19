import { z } from "zod";

export const ReactionTypeSchema = z.enum([
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
]);

export const AnalysisSchema = z.object({
  /** Plain-English overview of the reaction */
  overview: z.string().min(1),

  /** Technical mechanistic explanation */
  mechanism: z.string().min(1),

  /** Reaction classification - Uses Zod v4 clean fallback catch block */
  reactionType: ReactionTypeSchema.catch("Unknown"),

  /** Standard enthalpy ΔH° in kJ/mol. Adheres to strict anti-null rules */
  enthalpy: z.number().finite().optional(),

  /** Standard entropy ΔS° in J/(mol·K). Adheres to strict anti-null rules */
  entropy: z.number().finite().optional(),

  /** Standard Gibbs free energy ΔG° in kJ/mol. Adheres to strict anti-null rules */
  gibbs: z.number().finite().optional(),
});

export type AnalysisPayload = z.infer<typeof AnalysisSchema>;