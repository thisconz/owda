import { AIError } from "./errors";

interface RetryOptions {
  maxAttempts: number;

  baseDelayMs: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!(error instanceof AIError) || !error.retryable) {
        throw error;
      }

      if (attempt >= options.maxAttempts) {
        throw error;
      }

      const delay = options.baseDelayMs * Math.pow(2, attempt - 1);

      await sleep(delay);
    }
  }

  throw lastError;
}
