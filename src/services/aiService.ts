import { ExplanationStep } from '../types';

/**
 * OWDA AI Service — Layer 3
 *
 * Sends a chemical reaction expression to the Anthropic Claude API and
 * returns structured thermodynamic estimates plus multi-level explanations.
 *
 * Transport: fetch → api.anthropic.com/v1/messages (artifact proxy — no key
 * is embedded in the bundle; the platform injects the credential server-side).
 *
 * The service is intentionally stateless: every call is a fresh HTTP request
 * with no caching. Rate-limiting and quota management are handled upstream.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIThermodynamics {
  /** ΔH in kJ/mol. Undefined if the model could not estimate. */
  enthalpy:      number | undefined;
  /** ΔS in J/mol·K. Undefined if the model could not estimate. */
  entropy:       number | undefined;
  /** ΔG in kJ/mol. Undefined if the model could not estimate. */
  gibbs:         number | undefined;
  /** Reaction type classification string. */
  type:          string;
}

export interface AIAnalysisResult {
  steps:          ExplanationStep[];
  thermodynamics: AIThermodynamics;
}

/** Raw JSON shape expected from Claude */
interface ClaudeAnalysisPayload {
  overview:      string;
  mechanism:     string;
  reactionType:  string;
  enthalpy?:     number;
  entropy?:      number;
  gibbs?:        number;
}

type AIProvider = 'anthropic' | 'openai' | 'google';

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
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.ANTHROPIC_API_KEY,
  },

  gpt4o: {
    provider: 'openai',
    model: 'gpt-4o',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.OPENAI_API_KEY,
  },

  gemini: {
    provider: 'google',
    model: 'gemini-2.5-pro',
    apiUrl:
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
    apiKey: import.meta.env.GEMINI_API_KEY,
  },
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ACTIVE_MODEL = 'claude';

const MAX_TOKENS = 1024;
const TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 1200;

const RETRYABLE_STATUS_CODES = new Set([
  429,
  500,
  502,
  503,
  504,
]);

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
function parseClaudeResponse(raw: string): ClaudeAnalysisPayload {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude returned non-JSON content: ${cleaned.slice(0, 120)}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Claude response was not a JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj['overview'] !== 'string' || !obj['overview'].trim()) {
    throw new Error('Claude response missing required "overview" field.');
  }
  if (typeof obj['mechanism'] !== 'string' || !obj['mechanism'].trim()) {
    throw new Error('Claude response missing required "mechanism" field.');
  }
  if (typeof obj['reactionType'] !== 'string' || !obj['reactionType'].trim()) {
    throw new Error('Claude response missing required "reactionType" field.');
  }

  // Thermodynamic fields are optional — validate type only if present
  const assertOptionalNumber = (key: string) => {
    if (key in obj && typeof obj[key] !== 'number') {
      throw new Error(`Claude response field "${key}" must be a number, got ${typeof obj[key]}.`);
    }
  };
  assertOptionalNumber('enthalpy');
  assertOptionalNumber('entropy');
  assertOptionalNumber('gibbs');

  return {
    overview:     obj['overview']     as string,
    mechanism:    obj['mechanism']    as string,
    reactionType: obj['reactionType'] as string,
    enthalpy:     typeof obj['enthalpy'] === 'number' ? (obj['enthalpy'] as number) : undefined,
    entropy:      typeof obj['entropy']  === 'number' ? (obj['entropy']  as number) : undefined,
    gibbs:        typeof obj['gibbs']    === 'number' ? (obj['gibbs']    as number) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Step builders
// ---------------------------------------------------------------------------

function buildOverviewStep(overview: string): ExplanationStep {
  return {
    title:       'Basic Overview',
    description: overview,
    mode:        'human',
  };
}

function buildMechanismStep(mechanism: string): ExplanationStep {
  return {
    title:       'Reaction Mechanism',
    description: mechanism,
    mode:        'expert',
  };
}

function buildThermoStep(payload: ClaudeAnalysisPayload): ExplanationStep {
  const fmtNum = (v: number | undefined, unit: string) =>
    v !== undefined ? `**${v} ${unit}**` : '_Not estimated_';

  const spontaneity = (() => {
    if (payload.gibbs === undefined) return '_Cannot determine (ΔG unavailable)_';
    return payload.gibbs < 0
      ? '**✓ Spontaneous** (ΔG < 0)'
      : '**✗ Non-spontaneous** (ΔG > 0)';
  })();

  const description = [
    `**Reaction Type:** ${payload.reactionType}`,
    '',
    `| Property | Value |`,
    `|---|---|`,
    `| Enthalpy ΔH | ${fmtNum(payload.enthalpy, 'kJ/mol')} |`,
    `| Entropy ΔS  | ${fmtNum(payload.entropy,  'J/mol·K')} |`,
    `| Gibbs ΔG    | ${fmtNum(payload.gibbs,    'kJ/mol')} |`,
    `| Spontaneity | ${spontaneity} |`,
  ].join('\n');

  return {
    title:       'Thermodynamic Analysis',
    description,
    mode:        'machine',
  };
}

function buildErrorStep(expression: string, reason: string): ExplanationStep {
  return {
    title:       'AI Analysis Unavailable',
    description: [
      `**Reaction:** \`${expression}\``,
      '',
      `**Status:** AI service offline`,
      '',
      `**Reason:** ${reason}`,
      '',
      '_Enable AI in settings and retry, or check your network connection._',
    ].join('\n'),
    mode: 'machine',
  };
}

// ---------------------------------------------------------------------------
// HTTP transport with timeout + one retry
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url:     string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timerId);
  }
}

async function callClaudeAPI(expression: string): Promise<ClaudeAnalysisPayload> {
  const body = JSON.stringify({
    model:      AI_MODELS[ACTIVE_MODEL].model,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'user', content: buildPrompt(expression) },
    ],
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let lastError: Error = new Error('Unknown error');

  // Single retry loop: attempt 0, then attempt 1 on retryable status codes
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(AI_MODELS[ACTIVE_MODEL].apiUrl, { method: 'POST', headers, body }, TIMEOUT_MS);
    } catch (fetchErr) {
      // AbortError → timeout; TypeError → network failure
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      lastError = new Error(
        fetchErr instanceof DOMException && fetchErr.name === 'AbortError'
          ? `Request timed out after ${TIMEOUT_MS / 1000}s`
          : `Network error: ${msg}`
      );
      // Network errors are always retryable
      continue;
    }

    if (!response.ok) {
      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt === 0) {
        lastError = new Error(`API returned HTTP ${response.status} — retrying…`);
        continue;
      }
      // Non-retryable or second attempt: read error body for diagnostics
      let errorBody = '';
      try { errorBody = await response.text(); } catch { /* ignore */ }
      throw new Error(
        `API error ${response.status}: ${response.statusText}. ${errorBody.slice(0, 200)}`
      );
    }

    // Parse the Anthropic response envelope
    let envelope: Record<string, unknown>;
    try {
      envelope = await response.json() as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse API response as JSON.');
    }

    // Extract the text content block
    const contentArr = envelope['content'];
    if (!Array.isArray(contentArr) || contentArr.length === 0) {
      throw new Error('API response contained no content blocks.');
    }

    const textBlock = (contentArr as Array<Record<string, unknown>>)
      .find(block => block['type'] === 'text');

    if (!textBlock || typeof textBlock['text'] !== 'string') {
      throw new Error('API response had no text content block.');
    }

    // Parse and validate the structured payload
    return parseClaudeResponse(textBlock['text'] as string);
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
  public static async explainReaction(expression: string): Promise<AIAnalysisResult> {
    try {
      const payload = await callClaudeAPI(expression);

      return {
        steps: [
          buildOverviewStep(payload.overview),
          buildMechanismStep(payload.mechanism),
          buildThermoStep(payload),
        ],
        thermodynamics: {
          enthalpy: payload.enthalpy,
          entropy:  payload.entropy,
          gibbs:    payload.gibbs,
          type:     payload.reactionType,
        },
      };

    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);

      if (import.meta.env.DEV) {
        console.error('[OWDA AIService] Analysis failed:', reason);
      }

      return {
        steps: [
          buildErrorStep(expression, reason),
        ],
        thermodynamics: {
          enthalpy: undefined,
          entropy:  undefined,
          gibbs:    undefined,
          type:     'Unknown',
        },
      };
    }
  }
}