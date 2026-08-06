import { Platform } from 'react-native';

/**
 * Requests App Tracking Transparency (ATT) permission on iOS 14.5+.
 *
 * Apple requires this dialog to be shown before any SDK (Facebook, Adjust)
 * accesses the IDFA advertising identifier. Skipping it causes App Store rejection.
 *
 * - Called once at app startup, before analytics SDKs initialise.
 * - No-op on Android and web (IDFA does not exist on those platforms).
 * - The user's choice is persisted by the OS — the dialog only shows once per install.
 *   Subsequent calls resolve immediately with the cached status.
 * - We intentionally do NOT gate app usage on the outcome; tracking is optional.
 */
export async function requestTrackingTransparencyIfNeeded(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    // Dynamic import so the module is never evaluated on Android (avoids
    // linker errors if the native module is iOS-only).
    const { requestTrackingPermissionsAsync } = await import(
      'expo-tracking-transparency'
    );
    await requestTrackingPermissionsAsync();
    // We don't act on the granted/denied status — analytics SDKs handle
    // IDFA availability internally. Logging the status is intentionally
    // omitted to avoid storing a user privacy decision in logs.
  } catch {
    // Non-fatal: if ATT fails (e.g. old iOS version, simulator), proceed normally.
  }
}
