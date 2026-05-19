// D:\Dev\OWDA\src\config\models.ts

/**
 * OWDA AI Model Registry — Single Source of Truth (100% Free Tiers)
 *
 * ALL AI model definitions live here. No other file should
 * duplicate model IDs, API strings, or provider metadata.
 *
 * Import pattern:
 *   import { AI_MODEL_REGISTRY, AI_MODELS_LIST, DEFAULT_MODEL_ID } from "@/src/config/models";
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIModelId =
  | "nvidia/nemotron-3-super-120b-a12b:free"
  | "openrouter/owl-alpha"
  | "openai/gpt-oss-20b:free"
  | "poolside/laguna-m.1:free"

export interface AIModelDefinition {
  readonly id: AIModelId;
  /** Display name shown in the Settings UI */
  readonly label: string;
  /** Provider company name shown in the Settings UI */
  readonly provider: string;
  /** Full model string passed to OpenRouter API (must include :free suffix) */
  readonly apiModel: string;
  /** API endpoint URL — all models currently route through OpenRouter */
  readonly apiUrl: string;
  readonly maxTokens: number;
  /** Sampling temperature. */
  readonly temperature: number;
}

// ---------------------------------------------------------------------------
// Registry (Populated exclusively with reliable, free OpenRouter endpoints)
// ---------------------------------------------------------------------------

export const AI_MODEL_REGISTRY = {
  "nvidia/nemotron-3-super-120b-a12b:free": {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super 120B (Free)",
    provider: "NVIDIA",
    apiModel: "nvidia/nemotron-3-super-120b-a12b:free",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.2,
  },
  "openrouter/owl-alpha": {
    id: "openrouter/owl-alpha",
    label: "OWL Alpha (Free)",
    provider: "OpenRouter",
    apiModel: "openrouter/owl-alpha",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.2,
  },
  "openai/gpt-oss-20b:free": {
    id: "openai/gpt-oss-20b:free",
    label: "GPT-OSS 20B (Free)",
    provider: "OpenAI",
    apiModel: "gpt-oss-20b:free",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.2,
  },
  "poolside/laguna-m.1:free": {
    id: "poolside/laguna-m.1:free",
    label: "Laguna M.1 (Free)",
    provider: "Poolside",
    apiModel: "poolside/laguna-m.1:free",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.2,
  },
} as const satisfies Record<AIModelId, AIModelDefinition>;

// ---------------------------------------------------------------------------
// Convenience exports
// ---------------------------------------------------------------------------

/** Ordered list for UI rendering (maintains insertion order) */
export const AI_MODELS_LIST: readonly AIModelDefinition[] =
  Object.values(AI_MODEL_REGISTRY);

/** Default model used on first load and after factory reset */
export const DEFAULT_MODEL_ID: AIModelId = "nvidia/nemotron-3-super-120b-a12b:free";

/** Type guard — returns true if `id` is a valid AIModelId */
export function isValidModelId(id: unknown): id is AIModelId {
  return typeof id === "string" && id in AI_MODEL_REGISTRY;
}

/** Safely get a model definition, falling back to default */
export function getModelDefinition(id: AIModelId | string): AIModelDefinition {
  if (isValidModelId(id)) return AI_MODEL_REGISTRY[id];
  return AI_MODEL_REGISTRY[DEFAULT_MODEL_ID];
}