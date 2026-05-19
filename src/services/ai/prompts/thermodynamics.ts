/**
 * OWDA Thermodynamics AI Prompts
 *
 * All prompt strings focused on thermodynamic properties, phase-change calculations,
 * and heat capacity estimations live here.
 */

interface ThermodynamicsPromptOptions {
  expression: string;
  temperatureKelvin?: number; // Defaults to 298.15 K if not provided
  pressureAtm?: number;       // Defaults to 1.0 atm if not provided
}

/**
 * Builds a structured thermodynamic prompt for calculating high-fidelity state functions.
 */
export function buildThermodynamicsPrompt(options: ThermodynamicsPromptOptions): string {
  const { expression, temperatureKelvin = 298.15, pressureAtm = 1.0 } = options;
  const safeExpression = expression.replace(/"/g, "'").slice(0, 500);

  return `You are a high-precision chemical thermodynamics expert assistant operating inside OWDA.OS.

Analyze the thermodynamic profile of this reaction/system: "${safeExpression}"
Condition parameters:
- Temperature (T): ${temperatureKelvin} K
- Pressure (P): ${pressureAtm} atm

Respond ONLY with a single valid JSON object. No markdown fences, no conversational preambles or postscripts.

The JSON structure must match this exact schema:
{
  "enthalpy": <number: estimated standard enthalpy change ΔH in kJ/mol>,
  "entropy": <number: estimated standard entropy change ΔS in J/(mol·K)>,
  "gibbs": <number: calculated Gibbs free energy change ΔG in kJ/mol adhering to ΔG = ΔH - T·ΔS>,
  "isSpontaneous": <boolean: true if ΔG < 0, false if ΔG >= 0>,
  "equilibriumConstantK": <number: estimated equilibrium constant K calculated via ΔG = -R·T·ln(K) if available>,
  "confidenceScore": <number: value between 0.00 and 1.00 indicating estimation reliability>
}

Critical structural rules:
1. If you lack empirical data or structural references to estimate a value (such as equilibriumConstantK), completely OMIT that key from the JSON object. Do NOT return null, NaN, or 0. Omission is handled as undefined.
2. Ensure mathematical consistency: ΔG must precisely equal ΔH - (T * ΔS / 1000) using T = ${temperatureKelvin} K.
3. The response must contain absolutely no markdown markers (such as \`\`\`json) and must be directly executable by JSON.parse().`;
}

/**
 * System prompt establishing the thermodynamics engine role boundaries.
 */
export function buildThermoSystemPrompt(): string {
  return [
    "You are a computational chemical thermodynamics assistant that responds only in raw, unformatted JSON.",
    "Do not wrap your output in markdown code blocks, brackets, or backticks.",
    "All physical properties must be finite numbers. Never use null values. If data is unknown, completely omit the key.",
  ].join(" ");
}