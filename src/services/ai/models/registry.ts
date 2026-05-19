// D:\Dev\OWDA\src\services\ai\models\registry.ts

import { 
  AI_MODEL_REGISTRY, 
  type AIModelId, 
  type AIModelDefinition 
} from "../../../config/models";

// Clean re-exports from our config/models single source of truth
export { 
  AI_MODEL_REGISTRY, 
  type AIModelId, 
  type AIModelDefinition 
} from "../../../config/models";

/** Enhanced model interface adding specific local execution capabilities */
export interface AIModelCapabilities extends AIModelDefinition {
  readonly capabilities: readonly string[];
  readonly priority: number;
}

// Local functional capabilities definitions mapping directly to the 100% Free Single Source of Truth
const LOCAL_CAPABILITIES: Record<AIModelId, { readonly capabilities: readonly string[]; readonly priority: number }> = {
  "nvidia/nemotron-3-super-120b-a12b:free": {
    capabilities: ["fast", "chemistry", "structured-json"],
    priority: 1,
  },
  "openrouter/owl-alpha": {
    capabilities: ["fast", "general-purpose"],
    priority: 2,
  },
  "openai/gpt-oss-20b:free": {
    capabilities: ["general-purpose"],
    priority: 3,
  },
  "poolside/laguna-m.1:free": {
    capabilities: ["creative-writing", "code-generation"],
    priority: 4,
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
      // Fallback arrays and primitives are explicitly provided to avoid any null runtime gaps
      capabilities: extendedConfig !== undefined ? extendedConfig.capabilities : [],
      priority: extendedConfig !== undefined ? extendedConfig.priority : 99,
    };
    return acc;
  },
  {} as Record<AIModelId, AIModelCapabilities>
);