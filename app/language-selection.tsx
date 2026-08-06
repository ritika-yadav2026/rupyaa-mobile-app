import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components';
import { useLocaleStore } from '@/src/store/useLocaleStore';
import { colors, radius, spacing, typography } from '@/src/theme';
import { OnboardingLanguageOptionRow } from './onboarding-language';
import { LANGUAGE_OPTIONS } from '@/src/constants/data';

export default function LanguageSelectionScreen() {
  const language = useLocaleStore((state) => state.language);
  const setLanguage = useLocaleStore((state) => state.setLanguage);

  const languageOptionRows = LANGUAGE_OPTIONS.map((option) => (
    <OnboardingLanguageOptionRow
      key={option.code}
      option={option}
      isActive={option.code === language}
      onSelect={setLanguage}
    />
  ));
  return (
    <Screen edges={[]} contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.section}>
        {languageOptionRows}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.secondary,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  section: {
    gap: spacing.base,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  rowActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest_3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
});
