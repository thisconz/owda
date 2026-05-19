import { AI_MODELS, type AIModelCapabilities, type AIModelId } from "./registry";

/** Defines supported operational capability tags within OWDA.OS */
export type ModelCapabilityTag = 
  | "fast" 
  | "chemistry" 
  | "structured-json" 
  | "general-purpose" 
  | "code-generation" 
  | "creative-writing";

/**
 * Checks if a specific model possesses a requested capability.
 *
 * @param modelId - The unique ID of the target model
 * @param capability - The capability tag to query
 * @returns boolean indication of support
 */
export function modelHasCapability(modelId: AIModelId, capability: ModelCapabilityTag): boolean {
  const model: AIModelCapabilities | undefined = AI_MODELS[modelId];
  if (model === undefined) {
    return false;
  }
  return model.capabilities.includes(capability);
}

/**
 * Finds all active models that support the requested criteria.
 * Results are sorted by priority (lowest number = highest priority).
 *
 * @param capabilities - Single capability or collection of capabilities required
 * @returns Sorted array of model profiles satisfying the criteria
 */
export function findModelsByCapabilities(
  capabilities: ModelCapabilityTag | readonly ModelCapabilityTag[]
): readonly AIModelCapabilities[] {
  const requiredTags = Array.isArray(capabilities) ? capabilities : [capabilities];

  return Object.values(AI_MODELS)
    .filter((model) => 
      requiredTags.every((tag) => model.capabilities.includes(tag))
    )
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Discovers the absolute highest priority model matching the target capabilities.
 * 
 * @param capabilities - Required operational criteria
 * @returns The matching high-priority model or undefined if none match
 */
export function selectBestModelByCapability(
  capabilities: ModelCapabilityTag | readonly ModelCapabilityTag[]
): AIModelCapabilities | undefined {
  const matches = findModelsByCapabilities(capabilities);
  // Strictly returns undefined when no items exist, bypassing null entries
  return matches[0] !== undefined ? matches[0] : undefined;
}