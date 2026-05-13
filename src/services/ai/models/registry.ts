export type AIModelId = "claude-sonnet" | "gpt4o" | "gemini-pro";

export interface AIModel {
  id: AIModelId;

  model: string;

  capabilities: string[];

  priority: number;

  maxTokens: number;

  temperature: number;
}

export const AI_MODELS: Record<AIModelId, AIModel> = {
  "claude-sonnet": {
    id: "claude-sonnet",

    model: "anthropic/claude-3.7-sonnet",

    capabilities: ["reasoning", "chemistry", "thermodynamics"],

    priority: 1,

    maxTokens: 4096,

    temperature: 0.2,
  },

  gpt4o: {
    id: "gpt4o",

    model: "openai/gpt-4o",

    capabilities: ["vision", "fast"],

    priority: 2,

    maxTokens: 4096,

    temperature: 0.3,
  },

  "gemini-pro": {
    id: "gemini-pro",

    model: "google/gemini-2.5-pro",

    capabilities: ["reasoning", "large-context"],

    priority: 1,

    maxTokens: 8192,

    temperature: 0.2,
  },
};
