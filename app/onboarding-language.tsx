import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Screen } from '@/src/components';
import { type LanguageCode } from '@/src/config/languages';
import { storageService } from '@/src/services/storage';
import { useLocaleStore } from '@/src/store/useLocaleStore';
import { colors, getFontFamily, radius, spacing, typography } from '@/src/theme';
import { LANGUAGE_OPTIONS } from '@/src/constants/data';
import { OnboardingLanguageOptionRowProps } from '@/src/types/common';

const optionLabelFont = getFontFamily('semiBold', 'hi');

export default function OnboardingLanguageScreen() {
  const router = useRouter();
  const language = useLocaleStore((state) => state.language);
  const setLanguage = useLocaleStore((state) => state.setLanguage);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    setIsSaving(true);
    setLanguage(selectedLanguage);
    await storageService.setKey('hasSelectedLanguage', 'true');
    router.replace('/onboarding');
  };
  const languageOptionRows = LANGUAGE_OPTIONS.map((option) => (
    <OnboardingLanguageOptionRow
      key={option.code}
      option={option}
      isActive={option.code === selectedLanguage}
      onSelect={setSelectedLanguage}
    />
  ));

  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="h4" weight="bold" color="textprimary" style={styles.title}>
          Choose your language
        </AppText>
        <AppText variant="caption" weight="regular" color="secondary" style={styles.subtitle}>
          Please, Select your preferred language
        </AppText>
      </View>

      <View style={styles.options}>
        {languageOptionRows}
      </View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          size="medium"
          fullWidth
          loading={isSaving}
          disabled={isSaving}
          onPress={handleContinue}
          style={styles.continueButton}
          textStyle={styles.continueButtonText}
          textSize="sm"
        >
          Continue
        </Button>
      </View>
    </Screen>
  );
}

export function OnboardingLanguageOptionRow({
  option,
  isActive,
  onSelect,
}: OnboardingLanguageOptionRowProps) {
  let radioIcon = <Circle size={18} color={colors.border.main} strokeWidth={1.5} />;

  if (isActive) {
    radioIcon = <Check size={14} color={colors.text.inverse} strokeWidth={3} />;
  }

  return (
    <Pressable
      onPress={() => onSelect(option.code)}
      style={[styles.option, isActive && styles.optionActive]}
      accessibilityRole="radio"
      accessibilityState={{ checked: isActive }}
    >
      <Text style={styles.flag}>{option.flag}</Text>
      <Text style={styles.optionLabel}>{option.label}</Text>
      <View style={[styles.radio, isActive && styles.radioActive]}>
        {radioIcon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.transparent,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['4xl'],
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.md,
  },
  optionActive: {
    borderColor: colors.warning.light,
    backgroundColor: colors.warning.bg,
  },
  flag: {
    width: 26,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
  },
  optionLabel: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.xs,
    color: colors.text.primary,
    fontFamily: optionLabelFont,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioActive: {
    borderRadius: radius.full,
    backgroundColor: colors.text.black,
  },
  footer: {
    marginTop: 'auto',
  },
  continueButton: {
    minHeight: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.warning.light,
    paddingVertical: spacing.sm,
  },
  continueButtonText: {
    color: colors.text.black,
  },
});
