/**
 * Retry an async function with exponential backoff.
 * Delays: baseDelayMs, baseDelayMs*2, baseDelayMs*4, ...
 * Pure utility — no side effects; pass onRetry for logging.
 */

export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  /** Called before each retry (attempt is 1-based). */
  onRetry?: (attempt: number, maxRetries: number, delayMs: number) => void;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes fn(); on failure, waits with exponential backoff and retries up to maxRetries times.
 * @param fn Async function to execute
 * @param options maxRetries (default 3), baseDelayMs (default 1000), optional onRetry callback
 * @returns Result of fn()
 * @throws Last error if all attempts fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, onRetry } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        onRetry?.(attempt + 1, maxRetries, delayMs);
        await delay(delayMs);
      }
    }
  }
  throw lastError;
}
