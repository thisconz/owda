import { withRetry } from "../core/retry";
import { withTimeout } from "../core/timeout";

import { AIHTTPError, AIRateLimitError } from "../core/errors";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const TIMEOUT_MS = 15_000;

export async function openRouterChat(body: unknown) {
  return withRetry(
    async () => {
      const response = await withTimeout(
        fetch(OPENROUTER_URL, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          },

          body: JSON.stringify(body),
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
