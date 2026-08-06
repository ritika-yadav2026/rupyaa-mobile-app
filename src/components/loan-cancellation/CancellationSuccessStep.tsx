import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { SUCCESS_SUBTITLE, SUCCESS_TITLE } from './constants';
import { colors, spacing } from '@/src/theme';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';

const ICON_SIZE = 88;

export interface CancellationSuccessStepProps {
  onContinueHome: () => void;
}

/**
 * Success state: vertically and horizontally centered block (icon, title, copy, CTA)
 * matching loan-cancellation design — CTA is not full-bleed width.
 */
export function CancellationSuccessStep({
  onContinueHome,
}: CancellationSuccessStepProps): React.JSX.Element {
  return (
    <View
      style={styles.root}
      accessibilityLabel="Loan cancelled successfully"
    >
      <View style={styles.column}>
        <View style={styles.iconCircle}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={ICON_SIZE/2} color={colors.primary.main} />
        </View>

        <AppText variant="h2" weight="semiBold" color="textprimary" align="center" style={styles.title}>
          {SUCCESS_TITLE}
        </AppText>

        <AppText variant="caption" align="center" style={styles.subtitle}>
          {SUCCESS_SUBTITLE}
        </AppText>

        <Button
          variant="primary"
          size="medium"
          onPress={onContinueHome}
          accessibilityRole="button"
          accessibilityLabel="Continue to homepage"
          style={styles.cta}
        >
          Continue to Homepage
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: spacing.lg,
  },
  column: {
    // width: '100%',
    // maxWidth: 360,
    // backgroundColor: 'blue',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    lineHeight: 32,
  },
  subtitle: {
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: -spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  cta: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing['2xl'],
    minWidth: 220,
  },
});
