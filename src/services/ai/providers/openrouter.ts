import { withRetry } from "../core/retry";
import { withTimeout } from "../core/timeout";
import { AIHTTPError, AIRateLimitError } from "../core/errors";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TIMEOUT_MS = 15_000;

interface OpenRouterOptions {
  /** Optional AbortSignal to enable request cancellation from orchestration */
  signal?: AbortSignal;
}

/**
 * Executes a chat completion request to OpenRouter with integrated timeout,
 * exponential backoff retry policies, and cancellation support.
 */
export async function openRouterChat(body: unknown, options?: OpenRouterOptions) {
  const signal = options?.signal;

  return withRetry(
    async () => {
      // Short-circuit if the cancellation signal was triggered before execution or between retry cycles
      if (signal?.aborted) {
        throw signal.reason || new DOMException("The operation was aborted.", "AbortError");
      }

      const response = await withTimeout(
        fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify(body),
          // Cleanly maps undefined to null to respect exactOptionalPropertyTypes rules
          signal: signal ?? null,
        }),
        TIMEOUT_MS,
      );

      if (response.status === 429) {
        throw new AIRateLimitError();
      }

      if (!response.ok) {
        const text = await response.text();
        throw new AIHTTPError(response.status, text);
      }
      return response.json();
    },
    {
      maxAttempts: 3,
      baseDelayMs: 1000,
    },
  );
}