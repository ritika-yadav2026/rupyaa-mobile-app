import { logNonFatalError } from './nonFatalError';

export type FireAndForgetOptions = {
  /** Stable label for logs, e.g. 'loan-journey.fetchUserStage' */
  context: string;
};

/**
 * Runs a promise without awaiting; catches rejections so they never become unhandled.
 */
export function fireAndForget(
  promise: Promise<unknown>,
  options: FireAndForgetOptions
): void {
  void promise.catch((error: unknown) => {
    logNonFatalError(options.context, error);
  });
}
