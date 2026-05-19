/**
 * OWDA AI Orchestration — Chemistry Analysis
 *
 * This module is the single entry point for chemistry AI analysis.
 * It composes: prompt building → transport → response parsing → validation.
 */

import { openRouterChat } from "../providers/openrouter";
import { parseChemistryResponse } from "../parsers/chemistry";
import { buildChemistryPrompt, buildSystemPrompt } from "../prompts/chemistry";
import {
  AIModelId,
  getModelDefinition,
} from "../../../config/models";
import type { ChemistryAnalysisPayload } from "../parsers/validation";
import { AIParseError } from "../core/errors";

interface OrchestrationOptions {
  /** Optional AbortSignal to cleanly propagate cancellations across the AI cycle */
  signal?: AbortSignal;
}

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
 *   2. Sends via OpenRouter with integrated AbortSignal capabilities
 *   3. Extracts content string from envelope safely
 *   4. Parses and Zod-validates the chemical structure values
 *
 * @param expression - Balanced or unbalanced reaction string
 * @param modelId    - Which AI model to use (from config/models.ts)
 * @param options    - Optional runtime settings containing abort boundaries
 * @returns Validated payload matching ChemistryAnalysisPayload schema
 * @throws AIError variants on network error, parse failure, or schema validation failure
 */
export async function orchestrateChemistryAnalysis(
  expression: string,
  modelId: AIModelId,
  options?: OrchestrationOptions
): Promise<ChemistryAnalysisPayload> {
  const signal = options?.signal;

  // Short-circuit execution if the orchestration signal has already aborted
  if (signal?.aborted) {
    throw signal.reason || new DOMException("The operation was aborted.", "AbortError");
  }

  const body = buildRequestBody(expression, modelId);
  
  // Conditionally provide the configuration object to bypass exactOptionalPropertyTypes compilation roadblocks
  const providerOptions = signal ? { signal } : {};
  
  // Forward the safely isolated options down to the provider transport layer
  const envelope = await openRouterChat(body, providerOptions);
  
  const content = extractContent(envelope);
  
  return parseChemistryResponse(content);
}