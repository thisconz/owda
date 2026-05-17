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

export const ClaudeAnalysisSchema = z.object({
  overview: z.string().min(1),
  mechanism: z.string().min(1),
  reactionType: ReactionTypeSchema,
  enthalpy: z.number().optional(),
  entropy: z.number().optional(),
  gibbs: z.number().optional(),
});

export type ClaudeAnalysisPayload = z.infer<typeof ClaudeAnalysisSchema>;
