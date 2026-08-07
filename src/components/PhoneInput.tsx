import React, { type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from './AppText';

interface PhoneInputProps extends Omit<TextInputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  hasError?: boolean;
  errorMessage?: string;
  inputRef?: Ref<TextInput>;
  variant?: 'boxed' | 'underline';
  showCountryFlag?: boolean;
  compact?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  countryCode = '+91',
  hasError = false,
  errorMessage,
  inputRef,
  placeholder,
  variant = 'boxed',
  showCountryFlag = false,
  compact = false,
  ...props
}: PhoneInputProps) {
  const { t } = useTranslation();
  const handleChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      onChange(numericText);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrapper,
          variant === 'underline' && styles.inputWrapperUnderline,
          compact && styles.inputWrapperCompact,
          hasError && styles.inputWrapperError,
        ]}
      >
        {showCountryFlag ? <AppText style={styles.countryFlag}>🇮🇳</AppText> : null}
        <View style={styles.countryCodeContainer}>
          <AppText
            style={[styles.countryCode, compact && styles.countryCodeCompact]}
            weight="medium"
          >
            {countryCode}
          </AppText>
        </View>
        <TextInput
          ref={inputRef}
          style={[styles.input, compact && styles.inputCompact]}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          placeholder={t(placeholder ?? 'Enter mobile number')}
          placeholderTextColor={colors.text.tertiary}
          maxLength={10}
          {...props}
        />
      </View>
      {hasError && errorMessage && (
        <AppText style={styles.errorText} variant="caption">
          {errorMessage}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    borderRadius: radius.md,
    backgroundColor: colors.primary.lightest_3,
    paddingHorizontal: spacing.base,
    height: 53,
    justifyContent: 'center',
  },
  inputWrapperError: {
    borderColor: colors.error.main,
  },
  inputWrapperUnderline: {
    height: 40,
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primary.main,
    borderRadius: radius.none,
    paddingHorizontal: 0,
  },
  inputWrapperCompact: {
    height: 32,
  },
  countryFlag: {
    marginRight: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  countryCodeContainer: {
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.primary.main,
    marginRight: spacing.md,
  },
  countryCode: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  countryCodeCompact: {
    fontSize: typography.fontSize.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  inputCompact: {
    fontSize: typography.fontSize.xs,
  },
  errorText: {
    color: colors.error.main,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
