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
  | "gemini-flash-free"
  | "llama-3-3-free"
  | "deepseek-v3-free"
  | "mistral-small-free"
  | "qwen-coder-free";

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
  "gemini-flash-free": {
    id: "gemini-flash-free",
    label: "Gemini 2.5 Flash (Free)",
    provider: "Google",
    apiModel: "google/gemini-2.5-flash:free",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.2,
  },
  "llama-3-3-free": {
    id: "llama-3-3-free",
    label: "Llama 3.3 70B Instruct (Free)",
    provider: "Meta",
    apiModel: "meta-llama/llama-3.3-70b-instruct:free",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 2048,
    temperature: 0.3,
  },
  "deepseek-v3-free": {
    id: "deepseek-v3-free",
    label: "DeepSeek V3 (Free)",
    provider: "DeepSeek",
    apiModel: "deepseek/deepseek-chat:free",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 2048,
    temperature: 0.2,
  },
  "mistral-small-free": {
    id: "mistral-small-free",
    label: "Mistral Small 24B (Free)",
    provider: "Mistral",
    apiModel: "mistralai/mistral-small-3.1-24b-instruct:free",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 2048,
    temperature: 0.2,
  },
  "qwen-coder-free": {
    id: "qwen-coder-free",
    label: "Qwen 2.5 Coder 32B (Free)",
    provider: "Alibaba",
    apiModel: "qwen/qwen-2.5-coder-32b-instruct:free",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 2048,
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
export const DEFAULT_MODEL_ID: AIModelId = "gemini-flash-free";

/** Type guard — returns true if `id` is a valid AIModelId */
export function isValidModelId(id: unknown): id is AIModelId {
  return typeof id === "string" && id in AI_MODEL_REGISTRY;
}

/** Safely get a model definition, falling back to default */
export function getModelDefinition(id: AIModelId | string): AIModelDefinition {
  if (isValidModelId(id)) return AI_MODEL_REGISTRY[id];
  return AI_MODEL_REGISTRY[DEFAULT_MODEL_ID];
}