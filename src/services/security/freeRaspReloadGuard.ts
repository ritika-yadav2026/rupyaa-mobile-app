import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/constants/data';

// reloadAsync() resets the JS VM but not the native process, so the native
// freeRASP SDK is still "started" from before the reload. A flag older than
// this is assumed stale (e.g. reloadAsync() never actually fired) rather than
// trusted forever.
const RELOAD_FLAG_MAX_AGE_MS = 60_000;

// Covers OTA download + reload time when an older binary did not set the OTA reload flag.
const NATIVE_STARTED_MAX_AGE_MS = 5 * 60_000;

export async function markNextLaunchAsOtaReload(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.freeRaspOtaReloadAt, Date.now().toString());
}

/**
 * Persists when talsecStart() succeeded so a subsequent reloadAsync() boot can
 * skip re-starting the native SDK even if markNextLaunchAsOtaReload() was not called.
 */
export async function markFreeRaspNativeStarted(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.freeRaspNativeStartedAt, Date.now().toString());
}

/**
 * Reads and clears the OTA-reload flag, returning true only if it was set
 * recently enough to trust that this launch is the reloadAsync() relaunch
 * (not an unrelated cold start that happened to find a stale flag).
 */
export async function consumeIsFreshOtaReload(): Promise<boolean> {
  const storedAt = await AsyncStorage.getItem(STORAGE_KEYS.freeRaspOtaReloadAt);
  await AsyncStorage.removeItem(STORAGE_KEYS.freeRaspOtaReloadAt);
  if (!storedAt) {
    return false;
  }
  return Date.now() - Number(storedAt) < RELOAD_FLAG_MAX_AGE_MS;
}

async function isFreeRaspNativeRunning(): Promise<boolean> {
  const storedAt = await AsyncStorage.getItem(STORAGE_KEYS.freeRaspNativeStartedAt);
  if (!storedAt) {
    return false;
  }
  return Date.now() - Number(storedAt) < NATIVE_STARTED_MAX_AGE_MS;
}

/**
 * Primary: was this boot the result of a reloadAsync() OTA reload?
 * Secondary: was talsecStart() called recently enough that the native SDK is likely still running?
 */
export async function shouldSkipTalsecStart(): Promise<boolean> {
  return (await consumeIsFreshOtaReload()) || (await isFreeRaspNativeRunning());
}
