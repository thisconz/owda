import { ExplanationStep } from "../types";

/**
 * OWDA AI Service — Layer 3
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIThermodynamics {
  /** ΔH in kJ/mol. Undefined if the model could not estimate. */
  enthalpy: number | undefined;
  /** ΔS in J/mol·K. Undefined if the model could not estimate. */
  entropy: number | undefined;
  /** ΔG in kJ/mol. Undefined if the model could not estimate. */
  gibbs: number | undefined;
  /** Reaction type classification string. */
  type: string;
}

export interface AIAnalysisResult {
  steps: ExplanationStep[];
  thermodynamics: AIThermodynamics;
}

/** Raw JSON shape expected from Claude */
interface ClaudeAnalysisPayload {
  overview: string;
  mechanism: string;
  reactionType: string;
  enthalpy?: number;
  entropy?: number;
  gibbs?: number;
}

type AIProvider = "openrouter";

interface AIModelConfig {
  provider: AIProvider;
  model: string;
  apiUrl: string;
  apiKey?: string;
}

// ---------------------------------------------------------------------------
// AI Models
// ---------------------------------------------------------------------------

const AI_MODELS: Record<string, AIModelConfig> = {
  claude: {
    provider: "openrouter",
    model: "anthropic/claude-3.7-sonnet",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  },

  gpt4o: {
    provider: "openrouter",
    model: "openai/gpt-4o",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  },

  gemini: {
    provider: "openrouter",
    model: "google/gemini-2.5-pro",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  },
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ACTIVE_MODEL: keyof typeof AI_MODELS = "claude";

const MAX_TOKENS = 1024;
const TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 1200;

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(expression: string): string {
  return `You are a chemistry expert assistant embedded in a molecular simulation engine.

Analyze this chemical reaction: "${expression}"

Respond ONLY with a single valid JSON object — no markdown fences, no preamble, no trailing text.
The JSON must conform exactly to this schema:

{
  "overview":     "<2–3 sentence plain-English explanation of what happens>",
  "mechanism":    "<technical explanation: bond breaking/forming, intermediates, transition states, catalysis if relevant>",
  "reactionType": "<one of: Synthesis | Decomposition | Combustion | Single Replacement | Double Replacement | Acid-Base | Redox | Electrophilic Aromatic Substitution | Nucleophilic Addition | Polymerisation | Photolysis | Unknown>",
  "enthalpy":     <number: estimated ΔH in kJ/mol at 298 K and 1 atm, negative = exothermic>,
  "entropy":      <number: estimated ΔS in J/mol·K at 298 K>,
  "gibbs":        <number: estimated ΔG in kJ/mol at 298 K, derived from ΔH and ΔS if possible>
}

If you cannot estimate a thermodynamic value reliably, omit that key entirely — do not guess wildly.
Do not include comments, units strings, or any extra fields.`;
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

/**
 * Strips markdown code fences that Claude occasionally wraps JSON in,
 * then parses and validates the payload structure.
 */
function parseAIResponse(raw: string): ClaudeAnalysisPayload {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Claude returned non-JSON content: ${cleaned.slice(0, 120)}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Claude response was not a JSON object.");
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj["overview"] !== "string" || !obj["overview"].trim()) {
    throw new Error('Claude response missing required "overview" field.');
  }
  if (typeof obj["mechanism"] !== "string" || !obj["mechanism"].trim()) {
    throw new Error('Claude response missing required "mechanism" field.');
  }
  if (typeof obj["reactionType"] !== "string" || !obj["reactionType"].trim()) {
    throw new Error('Claude response missing required "reactionType" field.');
  }

  // Thermodynamic fields are optional — validate type only if present
  const assertOptionalNumber = (key: string) => {
    if (key in obj && typeof obj[key] !== "number") {
      throw new Error(
        `Claude response field "${key}" must be a number, got ${typeof obj[key]}.`,
      );
    }
  };
  assertOptionalNumber("enthalpy");
  assertOptionalNumber("entropy");
  assertOptionalNumber("gibbs");

  return {
    overview: obj["overview"] as string,
    mechanism: obj["mechanism"] as string,
    reactionType: obj["reactionType"] as string,
    enthalpy:
      typeof obj["enthalpy"] === "number"
        ? (obj["enthalpy"] as number)
        : undefined,
    entropy:
      typeof obj["entropy"] === "number"
        ? (obj["entropy"] as number)
        : undefined,
    gibbs:
      typeof obj["gibbs"] === "number" ? (obj["gibbs"] as number) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Step builders
// ---------------------------------------------------------------------------

function buildOverviewStep(overview: string): ExplanationStep {
  return {
    title: "Basic Overview",
    description: overview,
    mode: "human",
  };
}

function buildMechanismStep(mechanism: string): ExplanationStep {
  return {
    title: "Reaction Mechanism",
    description: mechanism,
    mode: "expert",
  };
}

function buildThermoStep(payload: ClaudeAnalysisPayload): ExplanationStep {
  const fmtNum = (v: number | undefined, unit: string) =>
    v !== undefined ? `**${v} ${unit}**` : "_Not estimated_";

  const spontaneity = (() => {
    if (payload.gibbs === undefined)
      return "_Cannot determine (ΔG unavailable)_";
    return payload.gibbs < 0
      ? "**✓ Spontaneous** (ΔG < 0)"
      : "**✗ Non-spontaneous** (ΔG > 0)";
  })();

  const description = [
    `**Reaction Type:** ${payload.reactionType}`,
    "",
    `| Property | Value |`,
    `|---|---|`,
    `| Enthalpy ΔH | ${fmtNum(payload.enthalpy, "kJ/mol")} |`,
    `| Entropy ΔS  | ${fmtNum(payload.entropy, "J/mol·K")} |`,
    `| Gibbs ΔG    | ${fmtNum(payload.gibbs, "kJ/mol")} |`,
    `| Spontaneity | ${spontaneity} |`,
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
      `**Status:** AI service offline`,
      "",
      `**Reason:** ${reason}`,
      "",
      "_Enable AI in settings and retry, or check your network connection._",
    ].join("\n"),
    mode: "machine",
  };
}

// ---------------------------------------------------------------------------
// HTTP transport with timeout + one retry
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timerId);
  }
}

async function callAI(expression: string, signal?: AbortSignal): Promise<ClaudeAnalysisPayload> {
  const modelConfig = AI_MODELS[ACTIVE_MODEL];

  const body = JSON.stringify({
    model: modelConfig.model,

    messages: [
      {
        role: "system",
        content:
          "You are a chemistry expert assistant that returns strict JSON only.",
      },
      {
        role: "user",
        content: buildPrompt(expression),
      },
    ],

    temperature: 0.2,
    max_tokens: MAX_TOKENS,

    response_format: {
      type: "json_object",
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${modelConfig.apiKey}`,

    // Optional but recommended
    "X-Title": "OWDA",
  };

  let lastError: Error = new Error("Unknown error");

  // Single retry loop: attempt 0, then attempt 1 on retryable status codes
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }

    let response: Response;

    try {
      response = await fetchWithTimeout(
        modelConfig.apiUrl,
        {
          method: "POST",
          headers,
          body,
          signal,
        },
        TIMEOUT_MS,
      );
    } catch (fetchErr) {
      const msg =
        fetchErr instanceof Error ? fetchErr.message : String(fetchErr);

      lastError = new Error(
        fetchErr instanceof DOMException && fetchErr.name === "AbortError"
          ? `Request timed out after ${TIMEOUT_MS / 1000}s`
          : `Network error: ${msg}`,
      );

      continue;
    }

    if (!response.ok) {
      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt === 0) {
        lastError = new Error(
          `API returned HTTP ${response.status} — retrying…`,
        );
        continue;
      }

      let errorBody = "";

      try {
        errorBody = await response.text();
      } catch {}

      throw new Error(
        `API error ${response.status}: ${response.statusText}. ${errorBody.slice(0, 200)}`,
      );
    }

    let envelope: any;

    try {
      envelope = await response.json();
    } catch {
      throw new Error("Failed to parse API response JSON.");
    }

    const content = envelope?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      throw new Error("OpenRouter response missing message content.");
    }

    return parseAIResponse(content);
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export class AIService {
  /**
   * Analyses a chemical reaction expression and returns structured
   * explanations and thermodynamic estimates.
   *
   * Never throws — on any failure returns a graceful fallback result
   * so the workspace remains functional without AI.
   */
  public static async explainReaction(
    expression: string, signal?: AbortSignal,
  ): Promise<AIAnalysisResult> {
    try {
      const payload = await callAI(expression, signal);

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
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);

      if (process.env.NODE_ENV) {
        console.error("[OWDA AIService] Analysis failed:", reason);
      }

      return {
        steps: [buildErrorStep(expression, reason)],
        thermodynamics: {
          enthalpy: undefined,
          entropy: undefined,
          gibbs: undefined,
          type: "Unknown",
        },
      };
    }
  }
}

