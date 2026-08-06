import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';
import { radius, spacing } from '@/src/theme';
import type { CancellationCalloutVariant } from './types';
import { getVariantStyles } from '@/src/utils/loan-cancellation';

/** `title`: description aligns with title text (not under icon). `full`: description uses full callout width. */
export type CancellationCalloutDescriptionAlign = 'full' | 'title';

const HEADER_ICON_SLOT_WIDTH = 28;

export interface CancellationCalloutBoxProps {
  variant?: CancellationCalloutVariant | 'outline';
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  /** Where the description sits relative to the icon/title header row. */
  descriptionAlign?: CancellationCalloutDescriptionAlign;
  style?: StyleProp<ViewStyle>;
}

export function CancellationCalloutBox({
  variant = 'outline',
  children,
  title,
  icon,
  descriptionAlign = 'full',
  style,
}: CancellationCalloutBoxProps): React.JSX.Element {
  const variantStyles = getVariantStyles(variant);
  const hasStackedHeader = title != null;
  const alignDescriptionWithTitle =
    descriptionAlign === 'title' && icon != null;

  if (hasStackedHeader) {
    return (
      <View style={[styles.container, variantStyles.container, style]}>
        <View style={styles.headerRow}>
          {icon != null ? <View style={styles.headerIconWrap}>{icon}</View> : null}
          <AppText variant="caption" weight="semiBold" >
            {title}
          </AppText>
        </View>
        <AppText
          variant="captionSmall"
          color="textprimary"
          style={[
            styles.stackedBody,
            alignDescriptionWithTitle ? styles.stackedBodyWithTitle : null,
          ]}
        >
          {children}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.inlineContainer, variantStyles.container, style]}>
      {icon != null ? <View style={styles.iconWrap}>{icon}</View> : null}
      <AppText variant="captionSmall" color="textprimary" style={styles.inlineBody}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minWidth: 0,
    gap: spacing.sm,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  headerIconWrap: {
    width: HEADER_ICON_SLOT_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },
  stackedBody: {
    width: '100%',
    lineHeight: 20,
  },
  stackedBodyWithTitle: {
    paddingLeft: HEADER_ICON_SLOT_WIDTH + spacing.sm,
  },
  iconWrap: {
    marginTop: 2,
  },
  inlineBody: {
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },
});
