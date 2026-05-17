// D:\Dev\OWDA\src\services\ai\orchestration\explainReaction.ts

/**
 * OWDA AI Orchestration — Chemistry Analysis
 *
 * This module is the single entry point for chemistry AI analysis.
 * It composes: prompt building → transport → response parsing → validation.
 */

import { openRouterChat } from "../providers/openrouter";
import { parseAIResponse } from "../parsers/json";
import { buildChemistryPrompt, buildSystemPrompt } from "../prompts/chemistry";
import {
  AIModelId,
  getModelDefinition,
} from "../../../config/models";
import type { ClaudeAnalysisPayload } from "../schemas/analysis";
import { AIParseError } from "../core/errors";

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
    // OpenRouter metadata configuration
    "X-Title": "OWDA Chemistry Engine",
  };
}

// ---------------------------------------------------------------------------
// Response extractor
// ---------------------------------------------------------------------------

interface OpenRouterChoiceMessage {
  readonly role?: string;
  readonly content?: string;
}

interface OpenRouterChoice {
  readonly message?: OpenRouterChoiceMessage;
  readonly finish_reason?: string;
}

interface OpenRouterEnvelope {
  readonly choices?: readonly OpenRouterChoice[];
}

function extractContent(envelope: unknown): string {
  // Check against unallocated profiles or primitives strictly matching undefined rules
  if (typeof envelope !== "object" || envelope === undefined || envelope === null) {
    throw new AIParseError("Invalid API response envelope topology: target is not an object.");
  }

  const typedEnvelope = envelope as OpenRouterEnvelope;

  if (typedEnvelope.choices === undefined || !Array.isArray(typedEnvelope.choices)) {
    throw new AIParseError("Invalid API response structure: missing or unallocated 'choices' block.");
  }

  if (typedEnvelope.choices.length === 0) {
    throw new AIParseError("API provider response stream arrived with an empty choices array configuration.");
  }

  const primaryChoice = typedEnvelope.choices[0];
  if (primaryChoice === undefined) {
    throw new AIParseError("API provider response first option index resolved to an undefined state.");
  }

  const content = primaryChoice.message?.content;

  // Strict handling for empty configurations or explicit null bindings injected by proxy arrays
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new AIParseError("API response message content target is empty, unallocated, or not a string.");
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
 * @throws AIError variants on network error, parse failure, or schema validation failure
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