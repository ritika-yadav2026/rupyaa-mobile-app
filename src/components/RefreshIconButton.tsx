import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { IMAGES } from '@/src/constants/images';
import { colors } from '@/src/theme';

export interface RefreshIconButtonProps {
  onPress?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  size?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable refresh icon button with loading state.
 * Keeps refresh affordance consistent across cards.
 */
export function RefreshIconButton({
  onPress,
  isLoading = false,
  disabled = false,
  accessibilityLabel = 'Refresh data',
  size = 40,
  iconColor,
  style,
}: RefreshIconButtonProps) {
  const isDisabled = disabled || isLoading || typeof onPress !== 'function';
  const iconSize = Math.max(16, Math.floor(size * 0.55));
  const borderRadius = size / 2;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius,
          opacity: pressed && !isDisabled ? 0.8 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary.main} />
      ) : (
        <Image
          source={IMAGES.REFRESH}
          style={{ width: iconSize, height: iconSize, tintColor: iconColor }}
          resizeMode="contain"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest_3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
