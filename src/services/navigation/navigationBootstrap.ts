import { consoleLogDev } from '@/src/utils/common-helper';

/**
 * Bootstrap latch.
 *
 * `app/index.tsx` is the single authority for the first navigation decision
 * (onboarding/auth/permissions/home). Child layouts (e.g. `(tabs)/_layout`)
 * can mount in parallel during cold start and would otherwise race the
 * resolver — hardcoded redirects to `/auth/mobile-verification` were
 * winning the race on fresh installs and skipping onboarding.
 *
 * This module exposes a one-shot promise latch:
 *   - index calls `markBootstrapComplete()` after it has chosen + replaced the route.
 *   - other guards `await waitForBootstrap()` before acting.
 *
 * Safety net: auto-resolves after BOOTSTRAP_TIMEOUT_MS so a hung index
 * cannot deadlock the app (e.g. blank screen with an infinite loader).
 */

const BOOTSTRAP_TIMEOUT_MS = 5000;

let isComplete = false;
let resolveLatch: (() => void) | null = null;

const latchPromise: Promise<void> = new Promise((resolve) => {
  resolveLatch = resolve;
});

// Auto-release the latch if index never finishes — keeps the app navigable
// even if the bootstrap path throws synchronously before reaching `finally`.
const timeoutHandle: ReturnType<typeof setTimeout> = setTimeout(() => {
  if (isComplete) return;
  consoleLogDev(
    '[NavigationBootstrap] Timeout reached before index completed; releasing latch',
  );
  isComplete = true;
  resolveLatch?.();
}, BOOTSTRAP_TIMEOUT_MS);

export function markBootstrapComplete(): void {
  if (isComplete) return;
  isComplete = true;
  clearTimeout(timeoutHandle);
  resolveLatch?.();
}

export function isBootstrapComplete(): boolean {
  return isComplete;
}

export function waitForBootstrap(): Promise<void> {
  if (isComplete) return Promise.resolve();
  return latchPromise;
}
