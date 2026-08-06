import * as Localization from 'expo-localization';

export const SUPPORTED_LANGUAGES = ['en', 'hi'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Autonyms (each language's name in itself) — must never have a hi.json translation
// entry, since the switcher always shows "English" / "हिंदी" regardless of active language.
export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'हिंदी',
};

export function isSupportedLanguage(value: string | null | undefined): value is LanguageCode {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Device locale, used as the language default before any user preference is persisted. */
export function resolveDeviceLanguage(): LanguageCode {
  const deviceLanguageCode = Localization.getLocales()[0]?.languageCode;
  return isSupportedLanguage(deviceLanguageCode) ? deviceLanguageCode : DEFAULT_LANGUAGE;
}
