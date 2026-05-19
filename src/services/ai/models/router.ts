import { AI_MODELS, type AIModelCapabilities } from "./registry";

/**
 * Dynamically resolves the optimal, cost-efficient model for executing
 * chemistry parsing, mechanistic analysis, and thermodynamic inferences.
 * 
 * @returns Fully capable model definition adhering to anti-null structural patterns.
 */
export function selectChemistryModel(): AIModelCapabilities {
  const primaryModel = AI_MODELS["nvidia/nemotron-3-super-120b-a12b:free"];

  if (primaryModel !== undefined) {
    return primaryModel;
  }

  // Resilient fallback logic if the primary free model is missing from runtime context
  const fallbackModel = AI_MODELS["openrouter/owl-alpha"];
  if (fallbackModel !== undefined) {
    return fallbackModel;
  }

  // Final emergency exit to prevent system breakages
  throw new Error("AI Routing System failed: No viable chemistry analysis models registered.");
}