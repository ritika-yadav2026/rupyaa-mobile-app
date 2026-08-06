import React, { type ReactNode, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, typography, radius } from '@/src/theme';
import { removeEmojis } from '@/src/utils/textInput/removeEmojis';
import { AppText } from './AppText';

interface FormInputProps extends TextInputProps {
  label: string;
  labelAccessory?: ReactNode;
  /** Rendered inside the input box on the left (e.g. "+91" prefix). */
  leftAccessory?: ReactNode;
  /** Rendered inside the input box on the right (e.g. Verify button). */
  rightAccessory?: ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  /** Ref forwarded to the underlying TextInput for programmatic focus. */
  inputRef?: Ref<TextInput>;
}

export function FormInput({
  label,
  labelAccessory,
  leftAccessory,
  rightAccessory,
  value,
  onChangeText,
  error,
  required = false,
  inputRef,
  multiline,
  style: inputStyle,
  placeholder,
  ...textInputProps
}: FormInputProps) {
  const { t } = useTranslation();
  const hasAccessories = Boolean(leftAccessory || rightAccessory);
  const handleChangeText = (text: string) => {
    onChangeText(removeEmojis(text));
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText style={styles.label}>
          {t(label)}
          {required && <AppText style={styles.required}> *</AppText>}
        </AppText>
        {labelAccessory ? <View style={styles.labelAccessory}>{labelAccessory}</View> : null}
      </View>
      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMultiline,
          hasAccessories && styles.inputWrapperWithAccessories,
          error && styles.inputError,
        ]}
      >
        {leftAccessory ? (
          <View style={styles.leftAccessoryWrap}>
            {leftAccessory}
            <View style={styles.accessoryDivider} />
          </View>
        ) : null}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            hasAccessories && styles.inputWithAccessories,
            inputStyle,
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder ? t(placeholder) : placeholder}
          placeholderTextColor={colors.text.tertiary}
          {...textInputProps}
          {...(multiline
            ? {
                multiline: true,
                // Parent scroll view handles scrolling; avoids flicker while typing.
                scrollEnabled: textInputProps.scrollEnabled ?? false,
                blurOnSubmit: textInputProps.blurOnSubmit ?? false,
                textAlignVertical: textInputProps.textAlignVertical ?? 'top',
              }
            : { multiline })}
        />
        {rightAccessory ? <View style={styles.rightAccessoryWrap}>{rightAccessory}</View> : null}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    flex: 1,
  },
  labelAccessory: {
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
  required: {
    color: colors.error.main,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.lightest_3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary.main,
    minHeight: 48,
  },
  /** Multiline: top-align text; `alignItems: 'center'` causes flicker while typing. */
  inputWrapperMultiline: {
    alignItems: 'flex-start',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  inputWrapperWithAccessories: {
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
  },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 0,
  },
  inputWithAccessories: {
    paddingHorizontal: spacing.sm,
  },
  leftAccessoryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  accessoryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border.light,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  rightAccessoryWrap: {
    flexShrink: 0,
    marginLeft: spacing.xs,
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
