// D:\Dev\OWDA\src\services\ai\models\registry.ts

import { 
  AI_MODEL_REGISTRY, 
  type AIModelId, 
  type AIModelDefinition 
} from "../../../config/models";

/** Enhanced model interface adding specific local execution capabilities */
export interface AIModelCapabilities extends AIModelDefinition {
  readonly capabilities: readonly string[];
  readonly priority: number;
}

// Local functional capabilities definitions mapping directly to the new 100% Free Single Source of Truth
const LOCAL_CAPABILITIES: Record<AIModelId, { readonly capabilities: readonly string[]; readonly priority: number }> = {
  "gemini-flash-free": {
    capabilities: ["fast", "chemistry", "structured-json"],
    priority: 1,
  },
  "llama-3-3-free": {
    capabilities: ["reasoning", "chemistry", "complex-analysis"],
    priority: 1,
  },
  "deepseek-v3-free": {
    capabilities: ["reasoning", "thermodynamics", "math"],
    priority: 2,
  },
  "mistral-small-free": {
    capabilities: ["fast", "explanation"],
    priority: 3,
  },
  "qwen-coder-free": {
    capabilities: ["structured-json", "data-extraction"],
    priority: 3,
  },
} as const;

/**
 * Enhanced runtime models registry.
 * Compiles capabilities on top of the central configuration parameters dynamically.
 */
export const AI_MODELS: Record<AIModelId, AIModelCapabilities> = Object.keys(AI_MODEL_REGISTRY).reduce(
  (acc, key) => {
    const modelId = key as AIModelId;
    const baseConfig = AI_MODEL_REGISTRY[modelId];
    const extendedConfig = LOCAL_CAPABILITIES[modelId];

    acc[modelId] = {
      ...baseConfig,
      // Fallback arrays and primitives are explicitly provided to avoid any null/undefined runtime gaps
      capabilities: extendedConfig !== undefined ? extendedConfig.capabilities : [],
      priority: extendedConfig !== undefined ? extendedConfig.priority : 99,
    };
    return acc;
  },
  {} as Record<AIModelId, AIModelCapabilities>
);