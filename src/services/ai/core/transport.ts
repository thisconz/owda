/**
 * OWDA AI Transport Layer
 * 
 * @deprecated This raw transport module is deprecated. 
 * All fetch mechanisms, timeout wrappers, exponential backoffs, and AbortSignal 
 * connection handles have been centralized directly inside `src/services/ai/providers/openrouter.ts`.
 */

import { openRouterChat } from "../providers/openrouter";

/**
 * Legacy transport post wrapper.
 * 
 * @deprecated Execute calls directly via `openRouterChat` inside `src/services/ai/providers/openrouter.ts`.
 */
export async function legacyRawPost(payload: unknown, signal?: AbortSignal): Promise<unknown> {
  console.warn(
    "[DEPRECATION WARNING]: 'legacyRawPost' inside 'src/services/ai/core/transport.ts' is deprecated. " +
    "Use direct 'openRouterChat' provider channels instead."
  );

  const options = signal ? { signal } : {};
  return openRouterChat(payload, options);
}