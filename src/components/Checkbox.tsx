import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, spacing, radius } from '@/src/theme';
import { AppText } from './AppText';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Plain text label; ignored when children is provided */
  label?: string;
  /** Rich label content (e.g. styled T&C link text); takes precedence over label */
  children?: React.ReactNode;
  /** Whether label content should expand and fill available row width */
  fillLabel?: boolean;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  checkedColor?: string;
  checkColor?: string;
  size?: number;
}

export function Checkbox({
  checked,
  onChange,
  label,
  children,
  fillLabel = true,
  leftIcon,
  disabled = false,
  style,
  checkedColor,
  checkColor = colors.text.inverse,
  size = 20,
}: CheckboxProps) {
  const hasLabelContent = children != null || (label != null && label !== '');
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => !disabled && onChange(!checked)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View
        style={[
          styles.checkbox,
          { width: size, height: size },
          checked && styles.checkboxChecked,
          checked && checkedColor ? { backgroundColor: checkedColor, borderColor: checkedColor } : null,
          disabled && styles.checkboxDisabled,
        ]}
      >
        {checked && (
          <Check size={Math.max(size - 4, 10)} color={checkColor} strokeWidth={3} />
        )}
      </View>
      {hasLabelContent && (
        <View style={[styles.labelContainer, !fillLabel && styles.labelContainerCompact]}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          {children != null ? (
            children
          ) : (
            <AppText style={[styles.label, !fillLabel && styles.labelCompact]} variant="caption">
              {label}
            </AppText>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border.main,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    flex: 1,
  },
  labelContainerCompact: {
    flex: 0,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  label: {
    color: colors.text.primary,
    flex: 1,
  },
  labelCompact: {
    flex: 0,
  },
});
