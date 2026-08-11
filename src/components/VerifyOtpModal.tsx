import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { OTPInput, type OTPInputRef } from './OTPInput';
import { CountdownTimer } from './CountdownTimer';
import { colors, spacing, radius } from '@/src/theme';
import ErrorContainer from './ErrorContainer';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';

/** Delay before focusing OTP input so keyboard opens after modal is shown (avoids Android/Modal focus issues). */
const FOCUS_DELAY_MS = 400;

export interface VerifyOtpModalProps {
  visible: boolean;
  /** Text shown as subtitle, e.g. "Enter OTP sent to you@example.com" */
  sentTo: string;
  otpValue: string;
  onOtpChange: (value: string) => void;
  onResend: () => void;
  onClose: () => void;
  /** Called when user taps Confirm (OTP length must be complete; parent validates and closes) */
  onConfirm: () => void;
  error?: string;
  /** Cooldown in seconds before resend is allowed */
  resendCooldownSeconds?: number;
  disabled?: boolean;
  /** Show loading spinner on Confirm button */
  loading?: boolean;
  /** OTP length (default 6); Confirm is disabled until this many digits entered */
  otpLength?: number;
}

/**
 * Reusable OTP verification modal as a bottom sheet with input, resend link and countdown timer.
 * Lifts with the keyboard when OTP input is focused.
 */
const CLOSE_BUTTON_SIZE = 44;
const DRAG_HANDLE_WIDTH = 40;
const DRAG_HANDLE_HEIGHT = 4;

export function VerifyOtpModal({
  visible,
  sentTo,
  otpValue,
  onOtpChange,
  onResend,
  onClose,
  onConfirm,
  error,
  resendCooldownSeconds = 60,
  disabled = false,
  loading = false,
  otpLength = 4,
}: VerifyOtpModalProps) {
  const insets = useSafeAreaInsets();
  const isOtpComplete = otpValue.length === otpLength;
  const canConfirm = isOtpComplete && !disabled;
  const bottomPadding = Math.max(insets.bottom, spacing.base);
  const keyboardHeight = useKeyboardHeight();
  const otpInputRef = useRef<OTPInputRef>(null);

  // Focus OTP input after modal is visible so the keypad opens reliably (fixes focus loss inside Modal on Android).
  useEffect(() => {
    if (!visible) return;
    const timeoutId = setTimeout(() => {
      otpInputRef.current?.focus();
    }, FOCUS_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.keyboardAvoiding, { paddingBottom: keyboardHeight }]}>
          <TouchableOpacity
            style={[styles.modalCard, { paddingBottom: bottomPadding }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dragHandle} />
            <View style={styles.header}>
              <View style={styles.headerSpacer} />
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={24} color={colors.text.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <AppText style={styles.title} variant="h3" weight="semiBold">
              Verify OTP
            </AppText>
            <AppText style={styles.sentToLabel} variant="caption" weight="semiBold">
              Enter the OTP sent to
            </AppText>
            <AppText style={styles.sentTo} variant="caption">
              {sentTo}
            </AppText>

            <View style={styles.otpWrap}>
              <OTPInput
                ref={otpInputRef}
                length={otpLength}
                value={otpValue}
                onChange={onOtpChange}
                disabled={disabled}
                hasError={!!error}
                autoFocus={false}
                cellStyle={styles.otpCell}
              />
            </View>
            <View style={styles.timerWrap}>
              <CountdownTimer
                initialSeconds={resendCooldownSeconds}
                onResend={onResend}
                textBefore="Didn't receive the OTP?"
                linkText="Resend"
                accentColor={colors.primary.main}
                secondsOnlyFormat
              />
            </View>
            {error && <View style={{ width: '100%' }}>
              <ErrorContainer responseError={error ?? ''} />
            </View>}
            <Button
              title="Confirm"
              variant="primary"
              size="large"
              fullWidth
              style={{ marginBottom: 10 }}
              onPress={onConfirm}
              disabled={!canConfirm}
              loading={loading}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  dragHandle: {
    width: DRAG_HANDLE_WIDTH,
    height: DRAG_HANDLE_HEIGHT,
    borderRadius: DRAG_HANDLE_HEIGHT / 2,
    backgroundColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: spacing.xs,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
    marginTop: -spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    lineHeight: 36,
    marginBottom: spacing.md,
  },
  sentToLabel: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sentTo: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error.main,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  otpWrap: {
    marginBottom: spacing.base,
    alignItems: 'center',
    width: '100%',
  },
  otpCell: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  timerWrap: {
    marginBottom: spacing.lg,
    width: '100%',
  },
});
