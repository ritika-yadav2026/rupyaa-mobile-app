import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing, typography } from '@/src/theme';

interface AadhaarBoxesInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  required?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
}

interface AadhaarBoxesFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
}

const TOTAL_DIGITS = 12;

export function AadhaarBoxesInput<T extends FieldValues>({
  control,
  name,
  label,
  required = false,
  editable = true,
  autoFocus = false,
}: AadhaarBoxesInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <AadhaarBoxesField
          label={label}
          value={value ?? ''}
          onChangeText={onChange}
          error={error?.message}
          required={required}
          editable={editable}
          autoFocus={autoFocus}
        />
      )}
    />
  );
}

function AadhaarBoxesField({
  label,
  value,
  onChangeText,
  error,
  required = false,
  editable = true,
  autoFocus = false,
}: AadhaarBoxesFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const digits = useMemo(() => value.replace(/\D/g, '').slice(0, TOTAL_DIGITS), [value]);
  const [boxWidth, setBoxWidth] = useState<number | null>(null);

  const handleBoxesLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const width = event.nativeEvent.layout.width;
    if (!width) return;
    // Keep all 12 boxes on a single row by calculating the width per box
    // after accounting for the visual gaps between groups.
    const interBoxGap = spacing.xs;
    const groupGap = spacing.md;
    const totalGap = interBoxGap * (TOTAL_DIGITS - 1) + groupGap * 2;
    const available = Math.max(width - totalGap, 0);
    const calculated = Math.floor(available / TOTAL_DIGITS);
    setBoxWidth(Math.max(calculated, 16));
  };

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, TOTAL_DIGITS);
    onChangeText(cleaned);
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.label} variant="caption" weight="medium">
        {t(label)}
        {required && <AppText style={styles.required}> *</AppText>}
      </AppText>

      <Pressable
        onPress={() => inputRef.current?.focus()}
        onLayout={handleBoxesLayout}
        style={[styles.boxesWrap, !editable && styles.disabled]}
      >
        <TextInput
          ref={inputRef}
          value={digits}
          onChangeText={handleChange}
          autoFocus={autoFocus}
          keyboardType="number-pad"
          maxLength={TOTAL_DIGITS}
          editable={editable}
          caretHidden
          style={styles.hiddenInput}
        />
        {Array.from({ length: TOTAL_DIGITS }).map((_, index) => {
          const char = digits[index] ?? '';
          const isGroupEnd = index === 3 || index === 7;
          return (
            <View
              key={`aadhaar-box-${index}`}
              style={[
                styles.box,
                boxWidth ? { width: boxWidth } : null,
                error && styles.boxError,
                isGroupEnd && styles.boxGroupGap,
              ]}
            >
              <AppText style={styles.boxText} variant="body" weight="semiBold">
                {char}
              </AppText>
            </View>
          );
        })}
      </Pressable>

      {error && (
        <AppText style={styles.errorText} variant="caption">
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error.main,
  },
  boxesWrap: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  box: {
    width: 24,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest_3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxGroupGap: {
    marginRight: spacing.md,
  },
  boxError: {
    borderColor: colors.error.main,
  },
  boxText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  errorText: {
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  disabled: {
    opacity: 0.6,
  },
});
