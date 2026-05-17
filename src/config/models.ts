/**
 * OWDA AI Model Registry — Single Source of Truth
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
  | "claude-3-7-sonnet"
  | "gpt-4o"
  | "gemini-2-5-pro"
  | "o1-mini";

export interface AIModelDefinition {
  readonly id: AIModelId;
  /** Display name shown in the Settings UI */
  readonly label: string;
  /** Provider company name shown in the Settings UI */
  readonly provider: string;
  /** Full model string passed to the API (e.g. "anthropic/claude-3.7-sonnet") */
  readonly apiModel: string;
  /** API endpoint URL — all models currently route through OpenRouter */
  readonly apiUrl: string;
  readonly maxTokens: number;
  /**
   * Sampling temperature.
   * Note: o1 models require temperature = 1.0 and ignore lower values.
   */
  readonly temperature: number;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const AI_MODEL_REGISTRY = {
  "claude-3-7-sonnet": {
    id: "claude-3-7-sonnet",
    label: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    apiModel: "anthropic/claude-3.7-sonnet",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 1024,
    temperature: 0.2,
  },
  "gpt-4o": {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    apiModel: "openai/gpt-4o",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 1024,
    temperature: 0.3,
  },
  "gemini-2-5-pro": {
    id: "gemini-2-5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    apiModel: "google/gemini-2.5-pro",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 2048,
    temperature: 0.2,
  },
  "o1-mini": {
    id: "o1-mini",
    label: "o1-mini",
    provider: "OpenAI",
    apiModel: "openai/o1-mini",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    maxTokens: 1024,
    temperature: 1.0, // o1 models require temperature ≥ 1
  },
} as const satisfies Record<AIModelId, AIModelDefinition>;

// ---------------------------------------------------------------------------
// Convenience exports
// ---------------------------------------------------------------------------

/** Ordered list for UI rendering (maintains insertion order) */
export const AI_MODELS_LIST: readonly AIModelDefinition[] =
  Object.values(AI_MODEL_REGISTRY);

/** Default model used on first load and after factory reset */
export const DEFAULT_MODEL_ID: AIModelId = "claude-3-7-sonnet";

/** Type guard — returns true if `id` is a valid AIModelId */
export function isValidModelId(id: unknown): id is AIModelId {
  return typeof id === "string" && id in AI_MODEL_REGISTRY;
}

/** Safely get a model definition, falling back to default */
export function getModelDefinition(id: AIModelId | string): AIModelDefinition {
  if (isValidModelId(id)) return AI_MODEL_REGISTRY[id];
  return AI_MODEL_REGISTRY[DEFAULT_MODEL_ID];
}