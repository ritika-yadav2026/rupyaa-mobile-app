import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius } from '@/src/theme';
import { AppText } from './AppText';

export interface RadioOption<T = string> {
  value: T;
  label: string;
  description?: string;
}

interface RadioGroupProps<T = string> {
  options: RadioOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  label?: string;
  error?: string;
  variant?: 'default' | 'card' | 'row';
  disabled?: boolean;
  style?: ViewStyle;
  accentColor?: string;
}

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  error,
  variant = 'default',
  disabled = false,
  style,
  accentColor,
}: RadioGroupProps<T>) {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <AppText
          style={styles.label}
          variant={variant === 'card' ? 'body' : 'caption'}
          weight={variant === 'card' ? 'semiBold' : 'medium'}
        >
          {label}
        </AppText>
      )}
      <View
        style={
          variant === 'card'
            ? styles.cardContainer
            : variant === 'row'
            ? styles.rowContainer
            : styles.optionsContainer
        }
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                variant === 'card' 
                  ? styles.cardOption 
                  : variant === 'row'
                  ? styles.rowOption
                  : styles.option,
                isSelected && (variant === 'card' ? styles.cardSelected : styles.optionSelected),
                error && styles.optionError,
              ]}
              onPress={() => !disabled && onChange(option.value)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              {variant === 'card' ? (
                // Card variant: text on left, radio on right
                <>
                  <View style={styles.cardTextContainer}>
                    <AppText
                      style={styles.cardOptionLabel}
                      variant="body"
                      weight="semiBold"
                    >
                      {option.label}
                    </AppText>
                    {option.description && (
                      <AppText
                        style={styles.cardOptionDescription}
                        variant="caption"
                        color='textprimary'
                      >
                        {option.description}
                      </AppText>
                    )}
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      styles.cardRadioOuter,
                      isSelected && styles.radioOuterSelected,
                      isSelected && accentColor ? { borderColor: accentColor } : null,
                    ]}
                  >
                    {isSelected && <View style={[styles.radioInner, accentColor ? { backgroundColor: accentColor } : null]} />}
                  </View>
                </>
              ) : (
                // Default/row variant: radio on left, text on right
                <View style={styles.radioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                      isSelected && accentColor ? { borderColor: accentColor } : null,
                    ]}
                  >
                    {isSelected && <View style={[styles.radioInner, accentColor ? { backgroundColor: accentColor } : null]} />}
                  </View>
                  <View style={variant === 'row' ? styles.rowLabelContainer : styles.labelContainer}>
                    <AppText
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                      variant="caption"
                      color='textprimary'
                      // weight="regular"
                    >
                      {option.label}
                    </AppText>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
    // marginBottom: spacing.lg,
  },
  label: {
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  cardContainer: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  rowOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.base,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: spacing.base
  },
  cardOptionLabel: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardOptionDescription: {
    color: colors.text.secondary,
  },
  cardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest_3,
  },
  optionSelected: {
    // For default variant - radio shows selection
  },
  optionError: {
    borderColor: colors.error.main,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.main,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  cardRadioOuter: {
    marginRight: 0,
  },
  radioOuterSelected: {
    borderColor: colors.primary.main,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.main,
  },
  labelContainer: {
    flex: 1,
  },
  rowLabelContainer: {
    flexShrink: 0,
  },
  optionLabel: {
    // color: colors.text.primary,
  },
  optionLabelSelected: {
    // color: colors.text.primary,
  },
  optionDescription: {
    // color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error.main,
    marginTop: spacing.xs,
  },
});
