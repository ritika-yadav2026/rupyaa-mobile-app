import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { CancellationCalloutBox } from './CancellationCalloutBox';
import {
  CONFIRM_INFO_CALLOUT,
  CONFIRM_INFO_CALLOUT_TITLE,
  CONFIRM_SUBTITLE,
  CONFIRM_TITLE,
} from './constants';
import { colors, spacing } from '@/src/theme';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';

const ICON_SIZE = 20;

export interface CancellationConfirmStepProps {
  /** Inline API error to surface below the info callout. */
  submitError?: string | null;
}

export interface CancellationConfirmFooterProps {
  isSubmitting: boolean;
  onKeepLoan: () => void;
  /** Triggers the cancel-loan API directly (no extra confirmation step). */
  onConfirmCancel: () => void;
}

export function CancellationConfirmStep({
  submitError,
}: CancellationConfirmStepProps): React.JSX.Element {
  return (
    <View style={styles.content}>
      <View style={styles.iconSection}>
        <View style={styles.alertIconCircle}>
          <AlertCircle size={40} color={colors.error.main} strokeWidth={2} />
        </View>
      </View>

      <AppText variant="h4" weight="semiBold" color="textprimary" align="center" style={styles.title}>
        {CONFIRM_TITLE}
      </AppText>
      <AppText variant="captionSmall" color="textprimary" align="center" style={styles.subtitle}>
        {CONFIRM_SUBTITLE}
      </AppText>

      <CancellationCalloutBox
        variant="info"
        title={CONFIRM_INFO_CALLOUT_TITLE}
        icon={
          <HugeiconsIcon icon={InformationCircleIcon} size={ICON_SIZE} color={colors.text.primary} />
        }
        style={styles.callout}
      >
        {CONFIRM_INFO_CALLOUT}
      </CancellationCalloutBox>

      {submitError != null ? (
        <AppText variant="captionSmall" align="center" style={styles.errorText}>
          {submitError}
        </AppText>
      ) : null}
    </View>
  );
}

export function CancellationConfirmFooter({
  isSubmitting,
  onKeepLoan,
  onConfirmCancel,
}: CancellationConfirmFooterProps): React.JSX.Element {
  return (
    <View style={styles.footer}>
      <Button
        variant="primary"
        size="large"
        fullWidth
        onPress={onKeepLoan}
        disabled={isSubmitting}
      >
        Keep Loan
      </Button>
      <Button
        variant="outline"
        size="large"
        fullWidth
        onPress={onConfirmCancel}
        loading={isSubmitting}
        disabled={isSubmitting}
        leftIcon={<X size={18} color={colors.error.main} />}
        textStyle={styles.cancelButtonText}
        style={styles.cancelButton}
      >
        Yes, Cancel
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconSection: {
    marginBottom: spacing.sm,
  },
  alertIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    lineHeight: 28,
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  callout: {
    width: '100%',
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.error.main,
    width: '100%',
  },
  footer: {
    gap: spacing.md,
  },
  cancelButton: {
    borderColor: colors.error.main,
    backgroundColor: colors.background.primary,
  },
  cancelButtonText: {
    color: colors.error.main,
  },
});
