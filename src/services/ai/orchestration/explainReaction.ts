/**
 * OWDA AI Orchestration — Chemistry Analysis
 *
 * This module is the single entry point for chemistry AI analysis.
 * It composes: prompt building → transport → response parsing → validation.
 *
 * Separation of concerns:
 *   buildChemistryPrompt()  ← prompts/chemistry.ts
 *   openRouterChat()        ← providers/openrouter.ts (handles retry/timeout)
 *   parseAIResponse()       ← parsers/json.ts (handles JSON extraction + Zod)
 */

import { openRouterChat } from "../providers/openrouter";
import { parseAIResponse } from "../parsers/json";
import { buildChemistryPrompt, buildSystemPrompt } from "../prompts/chemistry";
import {
  AI_MODEL_REGISTRY,
  AIModelId,
  getModelDefinition,
} from "../../../config/models";
import type { ClaudeAnalysisPayload } from "../schemas/analysis";

// ---------------------------------------------------------------------------
// Request builder
// ---------------------------------------------------------------------------

function buildRequestBody(
  expression: string,
  modelId: AIModelId,
): Record<string, unknown> {
  const modelDef = getModelDefinition(modelId);

  return {
    model: modelDef.apiModel,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user",   content: buildChemistryPrompt(expression) },
    ],
    temperature:     modelDef.temperature,
    max_tokens:      modelDef.maxTokens,
    response_format: { type: "json_object" },
    // OpenRouter metadata
    "X-Title": "OWDA Chemistry Engine",
  };
}

// ---------------------------------------------------------------------------
// Response extractor
// ---------------------------------------------------------------------------

function extractContent(envelope: unknown): string {
  if (
    typeof envelope !== "object" ||
    envelope === null ||
    !("choices" in envelope)
  ) {
    throw new Error("Invalid API response structure: missing 'choices' field.");
  }

  const choices = (envelope as { choices: unknown[] }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error("API response has empty 'choices' array.");
  }

  const content = (choices[0] as any)?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("API response message content is empty or not a string.");
  }

  return content;
}

// ---------------------------------------------------------------------------
// Public orchestration function
// ---------------------------------------------------------------------------

/**
 * Orchestrates a full chemistry analysis request:
 *   1. Builds typed API request body
 *   2. Sends via OpenRouter (with retry + timeout via openRouterChat)
 *   3. Extracts content string from envelope
 *   4. Parses and Zod-validates the JSON response
 *
 * @param expression - Balanced or unbalanced reaction string
 * @param modelId    - Which AI model to use (from config/models.ts)
 * @returns Validated payload matching ClaudeAnalysisPayload schema
 * @throws On network error, parse failure, or schema validation failure
 */
export async function orchestrateChemistryAnalysis(
  expression: string,
  modelId: AIModelId,
): Promise<ClaudeAnalysisPayload> {
  const body = buildRequestBody(expression, modelId);
  const envelope = await openRouterChat(body);
  const content = extractContent(envelope);
  return parseAIResponse(content);
}