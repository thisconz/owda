import { AITimeoutError } from "./errors";

/**
 * Enforces a strict execution time limit on an asymmetric network or processing operation.
 * Prevents memory leaks by cleanly clearing native timers upon settlement.
 *
 * @param operation - The underlying asynchronous target action
 * @param timeoutMs - Time allowance in milliseconds before throwing a timeout failure
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  // Track the timer ID across scope boundaries safely without structural null allocations
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AITimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    // Race the primary payload operation directly against our managed failure timer
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    // Defuse the timer instantly to free closures from the event loop heap
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}