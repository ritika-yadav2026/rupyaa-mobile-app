import { Platform } from 'react-native';
import { logNonFatalError } from './nonFatalError';

let isSetup = false;

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;

type ErrorUtilsLike = {
  getGlobalHandler: () => GlobalErrorHandler;
  setGlobalHandler: (handler: GlobalErrorHandler) => void;
};

const isErrorUtilsLike = (value: unknown): value is ErrorUtilsLike => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const utils = value as ErrorUtilsLike;
  return (
    typeof utils.getGlobalHandler === 'function' &&
    typeof utils.setGlobalHandler === 'function'
  );
};

/**
 * RN exposes ErrorUtils on `global`; the `react-native` named export is often undefined
 * (web, or during early module evaluation).
 */
const resolveErrorUtils = (): ErrorUtilsLike | undefined => {
  const fromGlobal = (globalThis as { ErrorUtils?: unknown }).ErrorUtils;
  if (isErrorUtilsLike(fromGlobal)) {
    return fromGlobal;
  }
  return undefined;
};

/**
 * Registers a global JS error handler (safety net for uncaught sync errors).
 * Preserves RN default handler so fatal errors still show red screen / crash as before.
 * No-op on web or when ErrorUtils is unavailable.
 */
export function setupGlobalErrorHandlers(): void {
  if (isSetup || Platform.OS === 'web') {
    return;
  }

  const errorUtils = resolveErrorUtils();
  if (!errorUtils) {
    return;
  }

  isSetup = true;

  const defaultHandler = errorUtils.getGlobalHandler();

  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const context = isFatal ? 'global.fatal' : 'global.nonFatal';
    logNonFatalError(context, error);

    if (typeof defaultHandler === 'function') {
      defaultHandler(error, isFatal ?? false);
    }
  });
}
