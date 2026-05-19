/**
 * OWDA Chemistry AI Prompts
 *
 * All prompt strings live here so they can be:
 * - Updated without touching service orchestration code
 * - A/B tested by swapping implementations
 */

/**
 * Builds the structured chemistry analysis prompt for a given reaction expression.
 *
 * @param expression - Normalized reaction string, e.g. "N2 + 3H2 -> 2NH3"
 */
export function buildChemistryPrompt(expression: string): string {
  // Escape any quotes in the expression to avoid prompt injection
  const safeExpression = expression.replace(/"/g, "'").slice(0, 500);

  return `You are a chemistry expert assistant embedded in a molecular simulation engine called OWDA.

Analyze this chemical reaction: "${safeExpression}"

Respond ONLY with a single valid JSON object. No markdown fences, no preamble, no trailing text, no comments.

The JSON must match this exact schema:

{
  "overview":     "<2–3 sentence plain-English explanation of what physically and chemically happens>",
  "mechanism":    "<technical explanation covering: bond breaking/forming, electron flow, intermediates, transition states, catalysis if relevant, stereochemistry if significant>",
  "reactionType": "<exactly one of: Synthesis | Decomposition | Combustion | Single Replacement | Double Replacement | Acid-Base | Redox | Electrophilic Aromatic Substitution | Nucleophilic Addition | Polymerisation | Photolysis | Unknown>",
  "enthalpy":     <number: estimated ΔH° in kJ/mol at 298 K, 1 atm; negative = exothermic>,
  "entropy":      <number: estimated ΔS° in J/(mol·K) at 298 K>,
  "gibbs":        <number: estimated ΔG° in kJ/mol at 298 K; derived from ΔH° − T·ΔS° where T = 298 K>
}

Critical rules:
1. If you cannot reliably estimate a thermodynamic value, OMIT that key entirely. Do NOT return 0, null, or a guess. Omission is treated as undefined.
2. The JSON must be parseable by JSON.parse() with zero preprocessing.
3. No trailing commas, no JavaScript-style comments, no extra fields.
4. Thermodynamic values must be numbers, not strings.`;
}

/**
 * System prompt establishing the AI's role and output contract.
 * Sent as the "system" role message before the user prompt.
 */
export function buildSystemPrompt(): string {
  return [
    "You are a chemistry expert assistant that always responds with strict, valid JSON.",
    "Never include markdown code fences, preambles, explanations, or any text outside the JSON object.",
    "Your response must be directly parseable by JSON.parse() without any preprocessing.",
    "Thermodynamic values must be numbers. Omit keys you cannot reliably estimate. Never use null values.",
  ].join(" ");
}