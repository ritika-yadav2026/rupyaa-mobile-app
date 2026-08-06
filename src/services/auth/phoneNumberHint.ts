import { Platform } from 'react-native';
import {
  isAvailableAsync,
  showPhoneNumberHintAsync,
} from 'expo-phone-number-hint';
import { consoleLogDev } from '@/src/utils/consoleLogDev';

const INDIA_COUNTRY_CODE = '91';
const INDIAN_MOBILE_NUMBER_LENGTH = 10;
const INDIAN_PHONE_REGEX = /^[1-9]\d{9}$/;

let hasOpenedPhoneNumberHintThisSession = false;

export async function isPhoneNumberHintAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    consoleLogDev('[PhoneNumberHint] availability skipped: unsupported platform', {
      platform: Platform.OS,
    });
    return false;
  }

  if (hasOpenedPhoneNumberHintThisSession) {
    consoleLogDev('[PhoneNumberHint] availability skipped: already opened this session');
    return false;
  }

  const isAvailable = await isAvailableAsync();
  consoleLogDev('[PhoneNumberHint] availability checked', { isAvailable });
  return isAvailable;
}

export async function requestPhoneNumberHint(): Promise<string | null> {
  if (hasOpenedPhoneNumberHintThisSession) {
    consoleLogDev('[PhoneNumberHint] request skipped: already opened this session');
    return null;
  }

  if (Platform.OS !== 'android') {
    consoleLogDev('[PhoneNumberHint] request skipped: unsupported platform', {
      platform: Platform.OS,
    });
    return null;
  }

  consoleLogDev('[PhoneNumberHint] opening picker');
  hasOpenedPhoneNumberHintThisSession = true;
  const phoneNumber = await showPhoneNumberHintAsync();
  const normalizedPhoneNumber = normalizeIndianPhoneNumberHint(phoneNumber);

  consoleLogDev('[PhoneNumberHint] picker result', {
    hasPhoneNumber: !!phoneNumber,
    normalized: !!normalizedPhoneNumber,
    normalizedLength: normalizedPhoneNumber?.length ?? 0,
    digitLength: phoneNumber?.replace(/\D/g, '').length ?? 0,
  });

  return normalizedPhoneNumber;
}

export function normalizeIndianPhoneNumberHint(phoneNumber?: string | null): string | null {
  if (!phoneNumber) return null;

  const digits = phoneNumber.replace(/\D/g, '');
  const lastTenDigits = digits.slice(-INDIAN_MOBILE_NUMBER_LENGTH);

  if (digits.length === INDIAN_MOBILE_NUMBER_LENGTH && INDIAN_PHONE_REGEX.test(digits)) {
    return digits;
  }

  if (
    digits.length === INDIA_COUNTRY_CODE.length + INDIAN_MOBILE_NUMBER_LENGTH &&
    digits.startsWith(INDIA_COUNTRY_CODE) &&
    INDIAN_PHONE_REGEX.test(digits.slice(INDIA_COUNTRY_CODE.length))
  ) {
    return digits.slice(INDIA_COUNTRY_CODE.length);
  }

  if (INDIAN_PHONE_REGEX.test(lastTenDigits)) {
    return lastTenDigits;
  }

  return null;
}
