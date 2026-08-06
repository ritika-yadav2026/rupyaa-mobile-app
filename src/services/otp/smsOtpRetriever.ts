import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { consoleLogDev } from '@/src/utils/consoleLogDev';

/**
 * Thin typed wrapper around the in-repo `SmsOtpRetriever` native module
 * (Android only). The module is registered by the `withSmsOtpRetriever`
 * Expo config plugin during `expo prebuild`.
 *
 * All methods are safe to call on iOS / when the native module is missing —
 * they resolve to no-op values so the OTP screen can fall back to QuickType
 * or manual entry without extra Platform checks at call sites.
 */

const LOG_TAG = '[OTP_AUTOFILL]';

interface SmsOtpRetrieverNativeModule {
  startSmsRetriever: () => Promise<boolean>;
  stopSmsRetriever: () => Promise<boolean>;
  getAppHash: () => Promise<string[]>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
}

export interface SmsOtpMessageEvent {
  message: string;
}

export type SmsOtpEventName = 'SmsOtpRetriever:otpMessage' | 'SmsOtpRetriever:timeout';

const nativeModule =
  Platform.OS === 'android'
    ? (NativeModules.SmsOtpRetriever as SmsOtpRetrieverNativeModule | undefined)
    : undefined;

const isAvailable = Boolean(nativeModule && typeof nativeModule.startSmsRetriever === 'function');

// One-shot diagnostic so anyone seeing "nothing happens" can tell from the
// very first JS log whether the native module is wired in or not.
if (Platform.OS === 'android' && !isAvailable) {
  // Warn (not log) so it stands out in Metro / logcat. Most common cause is
  // an outdated build that predates the `withSmsOtpRetriever` plugin.
  console.warn(
    `${LOG_TAG} Native SmsOtpRetriever module is NOT registered on this build. ` +
      `Zero-tap SMS autofill is disabled. Run \`npm run prebuild-android\` and ` +
      `rebuild the Android app to enable it. Manual entry + keyboard autofill ` +
      `(autoComplete="sms-otp") still work.`
  );
} else if (Platform.OS === 'android') {
  consoleLogDev(`${LOG_TAG} Native SmsOtpRetriever module is registered.`);
} else {
  consoleLogDev(
    `${LOG_TAG} Platform is ${Platform.OS} — zero-tap SMS autofill is Android-only.`
  );
}

// NativeEventEmitter requires a module argument on Android to bind to the
// native subscription bookkeeping (addListener / removeListeners on the module).
// Cast is necessary because RN does not export the NativeEventEmitter
// constructor's parameter type publicly.
const eventEmitter = isAvailable
  ? new NativeEventEmitter(nativeModule as unknown as ConstructorParameters<typeof NativeEventEmitter>[0])
  : null;

export const smsOtpRetriever = {
  /** True only on Android with the native module linked into the build. */
  isAvailable,

  /**
   * Starts the SMS Retriever listener (5-minute window). Resolves true on
   * success, false when unavailable / on iOS. Errors are caught and converted
   * to false so callers never need a try/catch for autofill setup.
   */
  start: async (): Promise<boolean> => {
    if (!isAvailable || !nativeModule) {
      consoleLogDev(
        `${LOG_TAG} start() skipped — native module unavailable on this build.`
      );
      return false;
    }
    try {
      await nativeModule.startSmsRetriever();
      consoleLogDev(
        `${LOG_TAG} SMS Retriever started. Listening up to 5 minutes for a matching SMS.`
      );
      return true;
    } catch (error) {
      console.warn(`${LOG_TAG} SMS Retriever start failed:`, error);
      return false;
    }
  },

  /** Stops the listener early (e.g. on unmount). Safe to call multiple times. */
  stop: async (): Promise<void> => {
    if (!isAvailable || !nativeModule) return;
    try {
      await nativeModule.stopSmsRetriever();
      consoleLogDev(`${LOG_TAG} SMS Retriever stopped.`);
    } catch {
      // Stop failures are non-fatal; receiver auto-cleans on next start.
    }
  },

  /**
   * Returns the 11-character app hash(es) for the installed APK. Debug and
   * release builds produce different hashes — backend must use the one that
   * matches the build on the test device.
   */
  getAppHash: async (): Promise<string[]> => {
    if (!isAvailable || !nativeModule) return [];
    try {
      const hashes = await nativeModule.getAppHash();
      return Array.isArray(hashes) ? hashes : [];
    } catch {
      return [];
    }
  },

  /**
   * Subscribes to OTP message broadcasts. Returns an unsubscribe function.
   * Resolves to a no-op unsubscribe when unavailable.
   */
  addMessageListener: (
    handler: (event: SmsOtpMessageEvent) => void
  ): (() => void) => {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener(
      'SmsOtpRetriever:otpMessage',
      handler
    );
    return () => subscription.remove();
  },

  /** Subscribes to the 5-minute timeout event. Returns an unsubscribe function. */
  addTimeoutListener: (handler: () => void): (() => void) => {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener(
      'SmsOtpRetriever:timeout',
      handler
    );
    return () => subscription.remove();
  },
};
