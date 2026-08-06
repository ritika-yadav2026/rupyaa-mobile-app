import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputKeyPressEventData,
  type TextStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';
import { sanitizeOtp } from '@/src/utils/otp/sanitizeOtp';

export interface OTPInputRef {
  focus: () => void;
}

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  cellStyle?: StyleProp<TextStyle>;
}

export const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(function OTPInput(
  {
    length = 6,
    value,
    onChange,
    disabled = false,
    hasError = false,
    autoFocus = false,
    cellStyle,
  },
  ref
) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const focusInput = (index: number) => {
    const targetIndex = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[targetIndex]?.focus();
  };

  useImperativeHandle(ref, () => ({
    focus: () => focusInput(Math.min(value.length, length - 1)),
  }));

  const handleChangeText = (text: string, index: number) => {
    const digits = sanitizeOtp(text, length);

    if (digits.length > 1) {
      onChange(digits);
      focusInput(Math.min(digits.length, length - 1));
      return;
    }

    if (digits.length === 0) {
      if (value[index]) {
        onChange(`${value.slice(0, index)}${value.slice(index + 1)}`);
      }
      return;
    }

    const nextValue = sanitizeOtp(
      `${value.slice(0, index)}${digits}${value.slice(index + 1)}`,
      length
    );
    onChange(nextValue);

    if (index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (event.nativeEvent.key !== 'Backspace' || value[index] || index === 0) return;

    const previousIndex = index - 1;
    onChange(`${value.slice(0, previousIndex)}${value.slice(previousIndex + 1)}`);
    focusInput(previousIndex);
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] ?? '';
        const isFocused = focusedIndex === index;

        return (
          <TextInput
            key={index}
            ref={(input) => {
              inputRefs.current[index] = input;
            }}
            style={[
              styles.input,
              isFocused && styles.inputFocused,
              digit && styles.inputFilled,
              hasError && styles.inputError,
              cellStyle,
            ]}
            value={digit}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((current) => current === index ? -1 : current)}
            keyboardType="number-pad"
            maxLength={index === 0 ? length : 1}
            autoComplete={Platform.OS === 'android' && index === 0 ? 'sms-otp' : 'off'}
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            importantForAutofill={Platform.OS === 'android' && index === 0 ? 'yes' : 'no'}
            autoFocus={autoFocus && index === 0}
            editable={!disabled}
            selectTextOnFocus
            caretHidden
            accessibilityLabel={`OTP digit ${index + 1}`}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  input: {
    width: 48,
    height: 53,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest_3,
    padding: 0,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  inputFocused: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest_3,
  },
  inputFilled: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest_3,
  },
  inputError: {
    borderColor: colors.error.main,
    color: colors.error.main,
  },
});
