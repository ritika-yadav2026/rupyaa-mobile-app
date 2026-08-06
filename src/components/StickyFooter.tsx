import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/src/theme';

export interface StickyFooterProps {
  /** Content to render in the sticky footer (typically a Button) */
  children: React.ReactNode;
  /** Optional style override for the footer container */
  style?: ViewStyle;
  /** Use safe area insets for bottom padding. Default: true */
  useSafeArea?: boolean;
}

/**
 * Sticky footer that stays fixed at the bottom of the screen.
 * Use with ScrollView: place StickyFooter as a sibling of ScrollView (outside of it).
 * Add paddingBottom to ScrollView's contentContainerStyle so content isn't hidden behind the footer.
 *
 * @example
 * <View style={{ flex: 1 }}>
 *   <ScrollView contentContainerStyle={{ paddingBottom: STICKY_FOOTER_PADDING }}>
 *     {content}
 *   </ScrollView>
 *   <StickyFooter>
 *     <Button fullWidth>Submit</Button>
 *   </StickyFooter>
 * </View>
 */
export function StickyFooter({
  children,
  style,
  useSafeArea = true,
}: StickyFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        useSafeArea && { paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Use this value for ScrollView contentContainerStyle.paddingBottom when using StickyFooter */
export const STICKY_FOOTER_PADDING = 100;

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
