import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, spacing } from '@/src/theme';

export interface StepResultScreenAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface StepResultScreenProps {
  /** Illustration image shown in the centered content area */
  image?: ImageSourcePropType;
  /** Icon node rendered instead of an image (e.g. an Ionicons checkmark) */
  icon?: React.ReactNode;
  title: string;
  /** Override title text color — defaults to primary text */
  titleColor?: string;
  subtitle?: string;
  /** Extra content rendered between title/subtitle and the action button (e.g. a PDF card) */
  children?: React.ReactNode;
  primaryAction: StepResultScreenAction;
}

/**
 * Reusable full-height result screen.
 *
 * Renders centered illustration + title + optional subtitle/children,
 * with the primary action button pinned to the bottom.
 * Designed to be dropped into a FullScreenModal or any flex-1 container.
 */
export const StepResultScreen = ({
  image,
  icon,
  title,
  titleColor,
  subtitle,
  children,
  primaryAction,
}: StepResultScreenProps): React.JSX.Element => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {image != null && (
          <Image source={image} resizeMode="contain" style={styles.image} />
        )}
        {icon != null && <View style={styles.iconWrapper}>{icon}</View>}
        <AppText
          style={[styles.title, titleColor != null ? { color: titleColor } : undefined]}
          variant="h4"
          weight="semiBold"
        >
          {title}
        </AppText>
        {subtitle != null && (
          <AppText style={styles.subtitle} variant="body">
            {subtitle}
          </AppText>
        )}
        {children}
      </View>
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={primaryAction.onPress}
          loading={primaryAction.loading}
          disabled={primaryAction.disabled}
        >
          {primaryAction.label}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 256,
    height: 256,
    marginBottom: spacing.xl,
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  footer: {
    paddingTop: spacing.lg,
  },
});
