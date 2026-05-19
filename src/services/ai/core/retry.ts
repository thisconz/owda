import { AIError } from "./errors";

interface RetryOptions {
  /** The absolute maximum number of execution attempts before completely throwing */
  maxAttempts: number;
  /** The starting delay in milliseconds before exponential scaling kicks in */
  baseDelayMs: number;
}

/**
 * Clean, lightweight promise-based sleep delay tool.
 */
function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps operations with an exponential backoff retry mechanism.
 * Respects strict execution boundaries and abort states by only retrying explicit AI retryable failures.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: unknown = undefined;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Fail fast if the error is a critical non-retryable failure or outside our AI boundaries
      if (!(error instanceof AIError) || !error.retryable) {
        throw error;
      }

      // If we have exhausted all allocated attempts, bubble up the final error
      if (attempt >= options.maxAttempts) {
        throw error;
      }

      // Compute standard exponential backoff delay: baseDelayMs * 2^(attempt - 1)
      const delay = options.baseDelayMs * Math.pow(2, attempt - 1);

      await sleep(delay);
    }
  }

  // Fallback engine defense line to ensure typescript never assumes an implicit undefined exit pathway
  throw lastError;
}