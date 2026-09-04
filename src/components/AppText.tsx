import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, getFontFamily } from '../theme';
import { AppTextProps, TextColor } from '../types/common';
import { useLocaleStore } from '../store/useLocaleStore';

export function AppText({
  variant = 'body',
  color = 'primary',
  weight = 'regular',
  align = 'left',
  style,
  children,
  ...props
}: AppTextProps) {
  const { t } = useTranslation();
  const language = useLocaleStore((state) => state.language);
  const variantStyle = styles[variant];
  const colorValue = getColorValue(color);
  const fontFamily = getFontFamily(weight, language);
  // Only a single plain string can be looked up as a translation key — arrays (text mixed
  // with variables/nested elements) are left as-is and must be keyed manually with t().
  const content = typeof children === 'string' ? t(children) : children;

  return (
    <Text
      style={[
        variantStyle,
        { color: colorValue, fontFamily, textAlign: align },
        style,
      ]}
      {...props}
    >
      {content}
    </Text>
  );
}

function getColorValue(color: TextColor): string {
  switch (color) {
    case 'primary':
      return colors.primary.main;
    case 'secondary':
      return colors.secondary.main;
    case 'accent':
      return colors.accent.main;
    case 'error':
      return colors.error.main;
    case 'success':
      return colors.success.main;
    case 'textprimary':
      return colors.text.primary;
    case 'black':
      return colors.text.black;
    default:
      return colors.text[color as keyof typeof colors.text];
  }
}

const styles = StyleSheet.create({
  h1: {
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
  },
  body: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  captionSmall: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },
  captionExtraSmall: {
    fontSize: typography.fontSize.xxs,
    lineHeight: typography.fontSize.xxs * typography.lineHeight.normal,
  },
  captionMedium: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
});
