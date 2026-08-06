import React from 'react';
import { View, ViewStyle } from 'react-native';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import { colors, spacing, radius } from '@/src/theme';

type RadiusKey = keyof typeof radius;
type SpacingKey = keyof typeof spacing;

function resolveRadius(value: RadiusKey | number): number {
  if (typeof value === 'number') return value;
  return radius[value] ?? radius.md;
}

function resolveSpacing(value: SpacingKey | number): number {
  if (typeof value === 'number') return value;
  return spacing[value] ?? spacing.md;
}

export interface IconWrapperProps {
  /** Icon from @hugeicons/core-free-icons (e.g., Call01Icon) */
  icon: IconSvgElement;
  /** Icon size in pixels */
  size?: number;
  /** Icon color */
  color?: string;
  /** Container size in pixels. When omitted, computed as iconSize + (padding * 2) */
  containerSize?: number;
  /** Background color of the container */
  backgroundColor?: string;
  /** Border radius - theme key or number */
  borderRadius?: RadiusKey | number;
  /** Padding around icon - theme key or number */
  padding?: SpacingKey | number;
  /** Additional container styles */
  style?: ViewStyle;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  icon,
  size = 24,
  color = colors.text.primary,
  containerSize,
  backgroundColor = colors.background.tertiary,
  borderRadius = 'md',
  padding = 'md',
  style,
}) => {
  const paddingValue = resolveSpacing(padding);
  const radiusValue = resolveRadius(borderRadius);
  const computedSize = containerSize ?? size + paddingValue * 2;

  const containerStyle: ViewStyle = {
    width: computedSize,
    height: computedSize,
    borderRadius: radiusValue,
    backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={[containerStyle, style]} accessibilityRole="image">
      <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={1.5} />
    </View>
  );
};
