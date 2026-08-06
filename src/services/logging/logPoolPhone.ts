import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/constants/data';
import { useUserDetailsStore } from '@/src/store/useUserDetailsStore';

const normalizePhone = (value: string | undefined | null): string =>
  typeof value === 'string' ? value.trim() : '';

/**
 * Save the verified phone used for log pool line prefixes (OTP / Credeau / softpull).
 */
export async function persistLogPoolPhoneNumber(phoneNumber: string): Promise<void> {
  const normalized = normalizePhone(phoneNumber);
  if (!normalized) {
    return;
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.verifiedPhoneNumber, normalized);
  } catch {
    // Non-fatal: resolveLogPoolPhoneNumber may still read from personal details.
  }
}

/**
 * Phone for log pool prefixes: personal details first, then OTP-persisted value.
 */
export async function resolveLogPoolPhoneNumber(): Promise<string> {
  const fromProfile = normalizePhone(
    useUserDetailsStore.getState().personalDetails?.phoneNumber
  );
  if (fromProfile) {
    return fromProfile;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.verifiedPhoneNumber);
    return normalizePhone(stored);
  } catch {
    return '';
  }
}
