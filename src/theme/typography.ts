import type { LanguageCode } from '@/src/config/languages';

// Poppins has no Devanagari glyphs, so Hindi falls back to Noto Sans Devanagari at the
// same weights. Add a row here for any future language that needs a different script.
const fontFamilyByLanguage: Record<LanguageCode, Record<'regular' | 'medium' | 'semiBold' | 'bold', string>> = {
  en: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  hi: {
    regular: 'NotoSansDevanagari_400Regular',
    medium: 'NotoSansDevanagari_500Medium',
    semiBold: 'NotoSansDevanagari_600SemiBold',
    bold: 'NotoSansDevanagari_700Bold',
  },
};

export function getFontFamily(weight: keyof typeof fontFamilyByLanguage['en'], language: LanguageCode): string {
  return fontFamilyByLanguage[language][weight];
}

export const typography = {
  fontFamily: fontFamilyByLanguage.en,
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
