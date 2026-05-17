/**
 * OWDA AI Service — Public API (Layer 3)
 *
 * This is the ONLY file that pages/components should import from.
 * All transport, retry, timeout, and parsing logic is delegated
 * to the services/ai/ module tree.
 *
 * Architecture:
 *   AIService.explainReaction()
 *     └─ orchestrateChemistryAnalysis()   (orchestration/explainReaction.ts)
 *         ├─ buildChemistryPrompt()       (prompts/chemistry.ts)
 *         ├─ openRouterChat()             (providers/openrouter.ts)
 *         └─ parseAIResponse()            (parsers/json.ts)
 */

import { orchestrateChemistryAnalysis } from "./ai/orchestration/explainReaction";
import type { AIModelId } from "../config/models";
import type { ExplanationStep } from "../types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AIThermodynamics {
  /** ΔH° in kJ/mol. `undefined` when the model could not estimate. */
  enthalpy: number | undefined;
  /** ΔS° in J/(mol·K). `undefined` when the model could not estimate. */
  entropy: number | undefined;
  /** ΔG° in kJ/mol. `undefined` when the model could not estimate. */
  gibbs: number | undefined;
  /** Reaction type classification string. */
  type: string;
}

export interface AIAnalysisResult {
  steps: ExplanationStep[];
  thermodynamics: AIThermodynamics;
}

// ---------------------------------------------------------------------------
// Step builders — pure functions, easily unit-testable
// ---------------------------------------------------------------------------

function buildOverviewStep(overview: string): ExplanationStep {
  return { title: "Basic Overview", description: overview, mode: "human" };
}

function buildMechanismStep(mechanism: string): ExplanationStep {
  return { title: "Reaction Mechanism", description: mechanism, mode: "expert" };
}

function buildThermoStep(payload: {
  reactionType: string;
  enthalpy?: number;
  entropy?: number;
  gibbs?: number;
}): ExplanationStep {
  const fmt = (v: number | undefined, unit: string) =>
    v !== undefined ? `**${v} ${unit}**` : "_Not estimated_";

  const spontaneity = (() => {
    if (payload.gibbs === undefined) return "_Cannot determine (ΔG unavailable)_";
    return payload.gibbs < 0
      ? "**✓ Spontaneous** (ΔG < 0)"
      : "**✗ Non-spontaneous** (ΔG > 0)";
  })();

  const description = [
    `**Reaction Type:** ${payload.reactionType}`,
    "",
    `| Property   | Value |`,
    `|---|---|`,
    `| Enthalpy ΔH° | ${fmt(payload.enthalpy, "kJ/mol")} |`,
    `| Entropy ΔS°  | ${fmt(payload.entropy, "J/(mol·K)")} |`,
    `| Gibbs ΔG°    | ${fmt(payload.gibbs, "kJ/mol")} |`,
    `| Spontaneity  | ${spontaneity} |`,
  ].join("\n");

  return { title: "Thermodynamic Analysis", description, mode: "machine" };
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
      "_Enable AI in settings and retry, or check your network connection._",
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
    // Bind the abort signal to a rejection — openRouterChat will handle it
    // via the fetch signal, but we also check after the await
    try {
      const payload = await orchestrateChemistryAnalysis(expression, modelId);

      // Check if aborted after the await resolves
      if (signal?.aborted) {
        return {
          steps: [],
          thermodynamics: UNKNOWN_THERMODYNAMICS,
        };
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
      // Suppress abort errors — they are expected and not failures
      if (
        err instanceof DOMException && err.name === "AbortError"
      ) {
        return { steps: [], thermodynamics: UNKNOWN_THERMODYNAMICS };
      }

      const reason = err instanceof Error ? err.message : String(err);

      if (process.env.NODE_ENV === "development") {
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