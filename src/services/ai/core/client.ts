/**
 * OWDA AI Client Module
 * 
 * @deprecated This legacy client structure is deprecated. 
 * Please route your AI requests through the streamlined orchestration layers 
 * found in `src/services/ai/orchestration/explainReaction.ts` and the unified 
 * OpenRouter provider engine.
 */

import { selectChemistryModel } from "../models/router";
import { orchestrateChemistryAnalysis } from "../orchestration/explainReaction";
import type { ChemistryAnalysisPayload } from "../parsers/validation";

/**
 * Legacy AI client invocation function.
 * 
 * @deprecated Use `orchestrateChemistryAnalysis` directly from orchestration layers instead.
 */
export async function legacyAnalyzeReaction(expression: string): Promise<ChemistryAnalysisPayload> {
  console.warn(
    "[DEPRECATION WARNING]: 'legacyAnalyzeReaction' inside 'src/services/ai/core/client.ts' is deprecated. " +
    "Transition to direct orchestration processing immediately."
  );
  
  const optimizedModel = selectChemistryModel();
  return orchestrateChemistryAnalysis(expression, optimizedModel.id);
}