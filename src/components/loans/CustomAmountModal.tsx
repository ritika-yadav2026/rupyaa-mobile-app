import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from '@/src/components';
import { Button } from '@/src/components/Button';
import { formatCurrency } from '@/src/utils/common-helper';

const DEFAULT_MIN_AMOUNT = 100;

export interface CustomAmountModalProps {
  visible: boolean;
  /** Maximum allowed amount (payment left / outstanding balance). */
  maxAmount: number;
  /** Minimum allowed amount for partial payment. */
  minAmount?: number;
  /** Callback when user confirms with a valid amount. */
  onConfirm: (amount: number) => void;
  /** Callback when user cancels or closes. */
  onClose: () => void;
}

function parseAmountInput(text: string): number {
  const cleaned = text.replace(/[^0-9]/g, '');
  if (cleaned === '') return 0;
  return Math.min(Number.parseInt(cleaned, 10) || 0, 999_999_999);
}

/**
 * Modal for entering a custom (partial) payment amount with min/max validation.
 */
export function CustomAmountModal({
  visible,
  maxAmount,
  minAmount = DEFAULT_MIN_AMOUNT,
  onConfirm,
  onClose,
}: CustomAmountModalProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const isNarrowScreen = width < 360;
  const [inputValue, setInputValue] = useState('');
  const [touched, setTouched] = useState(false);

  const amount = parseAmountInput(inputValue);
  const isValid = amount >= minAmount && amount <= maxAmount;
  const showError = touched && inputValue.length > 0 && !isValid;

  const errorMessage = ((): string | null => {
    if (!showError) return null;
    if (amount > maxAmount) {
      return `Amount cannot exceed ${formatCurrency(maxAmount)}`;
    }
    if (amount > 0 && amount < minAmount) {
      return `Please enter a valid amount greater than ${formatCurrency(minAmount)}`;
    }
    if (amount === 0) {
      return `Please enter a valid amount between ${formatCurrency(minAmount)} and ${formatCurrency(maxAmount)}`;
    }
    return null;
  })();

  const handleConfirm = (): void => {
    setTouched(true);
    if (!isValid) return;
    onConfirm(amount);
    setInputValue('');
    setTouched(false);
    onClose();
  };

  const handleClose = (): void => {
    setInputValue('');
    setTouched(false);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setInputValue('');
      setTouched(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.modalContent,
                isNarrowScreen && styles.modalContentNarrow,
              ]}
            >
              <AppText variant="h4" weight="semiBold" style={styles.title}>
                Pay Custom Amount
              </AppText>
              <AppText variant="caption" color="textprimary" style={styles.hint}>
                ({formatCurrency(minAmount)} - {formatCurrency(maxAmount)})
              </AppText>
              <View style={[styles.inputRow, showError && styles.inputRowError]}>
                <AppText variant="body" weight="semiBold" color="textprimary" style={styles.rupee}>
                  ₹
                </AppText>
                <TextInput
                  style={styles.input}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                  onBlur={() => setTouched(true)}
                  accessibilityLabel="Amount to pay"
                />
              </View>
              {errorMessage ? (
                <AppText variant="captionSmall" color="error" style={styles.errorText}>
                  {errorMessage}
                </AppText>
              ) : null}
              <View
                style={[
                  styles.buttonContainer,
                  isNarrowScreen && styles.buttonContainerStacked,
                ]}
              >
                <Button
                  title="Cancel"
                  onPress={handleClose}
                  variant="outline"
                  style={styles.button}
                />
                <Button
                  title={`Pay ${amount > 0 ? formatCurrency(amount) : 'Amount'}`}
                  onPress={handleConfirm}
                  disabled={!isValid}
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  modalContentNarrow: {
    width: '92%',
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  hint: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.lightest_3,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  rupee: {
    color: colors.text.primary,
    marginRight: spacing.xs,
    fontSize: typography.fontSize.base,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  inputRowError: {
    borderColor: colors.error.main,
  },
  errorText: {
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  buttonContainerStacked: {
    flexDirection: 'column-reverse',
  },
  button: {
    flex: 1,
  },
});
