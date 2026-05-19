// D:\Dev\OWDA\src\services\aiService.ts

/**
 * OWDA AI Service — Public API (Layer 3)
 *
 * This is the ONLY file that pages/components should import from.
 * All transport, retry, timeout, and parsing logic is delegated
 * to the services/ai/ module tree.
 */

import { orchestrateChemistryAnalysis } from "./ai/orchestration/explainReaction";
import type { AIModelId } from "../config/models";
import type { ExplanationStep } from "../types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AIThermodynamics {
  /** ΔH° in kJ/mol. `undefined` when the model could not estimate. */
  readonly enthalpy: number | undefined;
  /** ΔS° in J/(mol·K). `undefined` when the model could not estimate. */
  readonly entropy: number | undefined;
  /** ΔG° in kJ/mol. `undefined` when the model could not estimate. */
  readonly gibbs: number | undefined;
  /** Reaction type classification string. */
  readonly type: string;
}

export interface AIAnalysisResult {
  readonly steps: readonly ExplanationStep[];
  readonly thermodynamics: AIThermodynamics;
}

// ---------------------------------------------------------------------------
// Step builders — pure functions
// ---------------------------------------------------------------------------

function buildOverviewStep(overview: string): ExplanationStep {
  return { title: "Basic Overview", description: overview, mode: "human" };
}

function buildMechanismStep(mechanism: string): ExplanationStep {
  return { title: "Reaction Mechanism", description: mechanism, mode: "expert" };
}

function buildThermoStep(payload: {
  readonly reactionType: string;
  readonly enthalpy?: number | undefined;
  readonly entropy?: number | undefined;
  readonly gibbs?: number | undefined;
}): ExplanationStep {
  // Safe string formatting with fixed decimals
  const fmtVal = (v: number | undefined, unit: string): string =>
    v !== undefined ? `${v.toFixed(2)} ${unit}` : "Not estimated";

  // Isolate statuses and paddings cleanly
  const entSign = payload.enthalpy !== undefined 
    ? (payload.enthalpy < 0 ? "▼ Exothermic" : "▲ Endothermic")
    : "—";

  const entOrder = payload.entropy !== undefined
    ? (payload.entropy > 0 ? "Increasing Disorder" : "Decreasing Disorder")
    : "—";

  const spontaneity = (() => {
    if (payload.gibbs === undefined) return "UNKNOWN (ΔG MISSING)";
    return payload.gibbs < 0 ? "✓ SPONTANEOUS" : "✗ NON-SPONTANEOUS";
  })();

  // Plain-text key-value matrices are 100% stable across all markdown parsers
  const description = [
    `**Classification:** ${payload.reactionType}`,
    ``,
    `\`\`\``,
    `METRIC             | VALUE            | STATUS / SIGNATURE`,
    `-------------------|------------------|--------------------`,
    `Enthalpy (ΔH°)     | ${fmtVal(payload.enthalpy, "kJ/mol").padEnd(16)} | ${entSign}`,
    `Entropy (ΔS°)      | ${fmtVal(payload.entropy, "J/mol·K").padEnd(16)} | ${entOrder}`,
    `Gibbs Energy (ΔG°) | ${fmtVal(payload.gibbs, "kJ/mol").padEnd(16)} | Real-time Core Value`,
    `Feasibility        | ${spontaneity.padEnd(16)} | System State`,
    `\`\`\``,
    ``,
    `> **System Notice:** Matrix parameters generated assuming standard state conditions (STP).`,
  ].join("\n");

  return { 
    title: "Thermodynamic Analysis", 
    description, 
    mode: "machine",
  };
}

function buildErrorStep(expression: string, reason: string): ExplanationStep {
  return {
    title: "AI Analysis Unavailable",
    description: [
      `**Reaction:** \`${expression}\``,
      "",
      `**Status:** AI service offline or degraded`,
      "",
      `**Reason:** ${reason}`,
      "",
      `_Enable AI in settings and retry, or check your network connection._`,
    ].join("\n"),
    mode: "machine",
  };
}

function buildDisabledStep(): ExplanationStep {
  return {
    title: "AI Analysis Disabled",
    description:
      "Enable AI analysis in **Sys_Config** to receive thermodynamic estimates and mechanistic explanations.",
    mode: "machine",
  };
}

// ---------------------------------------------------------------------------
// Fallback thermodynamics
// ---------------------------------------------------------------------------

const UNKNOWN_THERMODYNAMICS: AIThermodynamics = {
  enthalpy: undefined,
  entropy: undefined,
  gibbs: undefined,
  type: "Unknown",
};

// ---------------------------------------------------------------------------
// Public service class
// ---------------------------------------------------------------------------

export class AIService {
  /**
   * Analyses a chemical reaction expression and returns structured
   * explanations and thermodynamic estimates.
   *
   * This method NEVER throws. On any failure it returns a graceful
   * fallback result so the workspace remains functional without AI.
   *
   * @param expression - Raw reaction string (e.g. "N2 + 3H2 -> 2NH3")
   * @param modelId    - AI model to use (from config/models.ts registry)
   * @param signal     - Optional AbortSignal for cancellation
   */
  public static async explainReaction(
    expression: string,
    modelId: AIModelId,
    signal?: AbortSignal,
  ): Promise<AIAnalysisResult> {
    
    // Fail fast if the token was aborted before launching execution
    if (signal?.aborted) {
      return { steps: [], thermodynamics: UNKNOWN_THERMODYNAMICS };
    }

    try {
      // Build options object conditionally to satisfy strict exactOptionalPropertyTypes compilation rules
      const orchestrationOptions = signal !== undefined ? { signal } : {};

      // Forward the runtime signal directly into the orchestration layer
      const rawPayload = await orchestrateChemistryAnalysis(expression, modelId, orchestrationOptions);

      // Enforce our strict Anti-Null normalization bounds immediately at the edge boundary
      const payload = {
        overview: rawPayload.overview,
        mechanism: rawPayload.mechanism,
        reactionType: rawPayload.reactionType,
        enthalpy: rawPayload.enthalpy ?? undefined,
        entropy: rawPayload.entropy ?? undefined,
        gibbs: rawPayload.gibbs ?? undefined,
      };

      if (signal?.aborted) {
        return { steps: [], thermodynamics: UNKNOWN_THERMODYNAMICS };
      }

      return {
        steps: [
          buildOverviewStep(payload.overview),
          buildMechanismStep(payload.mechanism),
          buildThermoStep(payload),
        ],
        thermodynamics: {
          enthalpy: payload.enthalpy,
          entropy: payload.entropy,
          gibbs: payload.gibbs,
          type: payload.reactionType,
        },
      };
    } catch (err: unknown) {
      // Handle standard and cross-runtime variant abort events cleanly
      const isAbortError = 
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError") ||
        signal?.aborted === true;

      if (isAbortError) {
        return { steps: [], thermodynamics: UNKNOWN_THERMODYNAMICS };
      }

      const reason = err instanceof Error ? err.message : String(err);

      // Simple runtime logging strategy for debug profiles
      if (import.meta.env.DEV) {
        console.error("[OWDA AIService] Analysis failed:", reason);
      }

      return {
        steps: [buildErrorStep(expression, reason)],
        thermodynamics: UNKNOWN_THERMODYNAMICS,
      };
    }
  }

  /**
   * Returns the steps for when AI is disabled by the user.
   * Avoids a network call and returns immediately.
   */
  public static disabledResult(): AIAnalysisResult {
    return {
      steps: [buildDisabledStep()],
      thermodynamics: UNKNOWN_THERMODYNAMICS,
    };
  }
}