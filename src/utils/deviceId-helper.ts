import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants/data';

/**
 * Return a stable per-install device id.
 * - First tries AsyncStorage
 * - If not present, generates a UUID v4, persists it, and returns it
 */
export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (existing) {
      return existing;
    }
    // Resolve an ID using platform-specific APIs
    const resolvedId = Platform.OS === 'android'
      ? (Application.getAndroidId())
      : (await Application.getIosIdForVendorAsync());
    const finalId = resolvedId || `${Date.now()}-${Math.random()}`; // last resort
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, finalId);
    return finalId;
  } catch {
    // If storage fails, still return a best-effort ID for this run
    const fallback = Platform.OS === 'android'
      ? (await Application.getAndroidId())
      : (await Application.getIosIdForVendorAsync());
    return fallback || `${Date.now()}-${Math.random()}`;
  }
};
