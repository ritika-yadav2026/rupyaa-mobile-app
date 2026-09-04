import { Platform, type TextStyle } from 'react-native';
import type { LanguageCode } from '@/src/config/languages';
import { colors } from './colors';
import { getFontFamily, typography } from './typography';

/** Shared size for form field value + placeholder text app-wide. */
export const FIELD_TEXT_SIZE = typography.fontSize.sm;

/**
 * Font + size used by FormInput, DateInput, DropdownSelect, and Input.
 * Keeps typed text and placeholders visually consistent with AppText (Poppins / Noto).
 */
export function getFieldTextStyle(
  language: LanguageCode,
  options: { isPlaceholder?: boolean } = {}
): TextStyle {
  return {
    fontSize: FIELD_TEXT_SIZE,
    fontFamily: getFontFamily('regular', language),
    color: options.isPlaceholder ? colors.text.tertiary : colors.text.primary,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  };
}
