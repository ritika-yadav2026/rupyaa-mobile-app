import React, { type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { colors, spacing, typography, radius, getFieldTextStyle } from '@/src/theme';
import { useLocaleStore } from '@/src/store/useLocaleStore';
import { AppText } from './AppText';

interface DateInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  /** Ref forwarded to the underlying TextInput for programmatic focus. */
  inputRef?: Ref<TextInput>;
}

function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function DateInput({
  label,
  value,
  onChangeText,
  error,
  required = false,
  inputRef,
  ...textInputProps
}: DateInputProps) {
  const { t } = useTranslation();
  const language = useLocaleStore((state) => state.language);
  const fieldTextStyle = getFieldTextStyle(language);
  const handleChange = (text: string) => {
    const formatted = formatDateInput(text);
    if (formatted.length <= 10) {
      onChangeText(formatted);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText style={styles.label}>
          {t(label)}
          {required && <AppText style={styles.required}> *</AppText>}
        </AppText>
      </View>
      <TextInput
        ref={inputRef}
        style={[styles.input, fieldTextStyle, error && styles.inputError]}
        value={value}
        onChangeText={handleChange}
        placeholder="dd/mm/yyyy"
        placeholderTextColor={colors.text.tertiary}
        keyboardType="number-pad"
        maxLength={10}
        {...textInputProps}
      />
      {error && <AppText style={styles.errorText}>{error}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  label: {
    flexDirection: 'row',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  required: {
    color: colors.error.main,
  },
  input: {
    backgroundColor: colors.primary.lightest_3,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  inputError: {
    borderColor: colors.error.main,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
});
