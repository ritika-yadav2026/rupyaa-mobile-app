import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { AppText, Chip, StickyFooter, STICKY_FOOTER_PADDING } from '@/src/components';
import { Button } from '@/src/components/Button';
import { RadioGroup } from '@/src/components/RadioGroup';
import { colors, spacing, radius, shadows, typography } from '@/src/theme';
import { formatCurrency, getTotalPayable } from '@/src/utils/common-helper';
import {
  formatLoanDate,
  getDisbursedDateString,
  getApplicationDisplay,
} from '@/src/utils/loan-formatters';
import { getActiveLoanStatusPill, resolvePaymentTotalPayable } from '@/src/utils/loan-helpers';
import {
  MIN_CUSTOM_AMOUNT,
  FIXED_AMOUNTS,
  PERCENTAGES,
  parseDecimalAmount,
  formatAmountForInput,
} from '@/src/utils/loan-amount-helpers';
import { NBFC_DISCLAIMER } from '@/src/constants/loans';
import type { Loan } from '@/src/types/loans';
import { LoanDetailRow, AmountSummaryBox } from './LoanDetailSection';
import { LoanApplicationHeader } from './LoanApplicationHeader';
import ErrorContainer from '../ErrorContainer';

export interface PaymentCardProps {
  loan: Loan;
  /** Called with the amount to pay (full or custom). */
  onPaymentPress: (amount: number) => void;
  ctaLoading?: boolean;
  ctaError?: string | null;
  /** When this value changes, the custom amount input is reset (e.g. when user returns to the screen after payment). */
  resetCustomAmountKey?: number;
}

type PaymentOption = 'full' | 'custom';

/**
 * Payment card: loan details, payment progress, payment options (full/custom for overdue),
 * quick amount options, custom input with min/max validation, and CTA.
 */
export function PaymentCard({
  loan,
  onPaymentPress,
  ctaLoading = false,
  ctaError = null,
  resetCustomAmountKey,
}: PaymentCardProps): React.ReactElement {
  const { t } = useTranslation();
  // resolvePaymentTotalPayable is the single source of truth for the payable amount.
  // Update that helper when the logic changes (e.g. partial payments, post-tenure penalties).
  // const totalPayable = resolvePaymentTotalPayable(loan);
  const totalPayable = loan.totalPayable ?? 0;
  const totalAmountPaid = loan.totalAmountPaid ?? 0;
  const paymentLeft = (loan?.amountDue ?? 0);
  const amountPayment = loan.amountDue ?? 0;
  // const amountPaid = loan.totalAmountPaid ?? 0;
  // const paymentLeft = Math.max(0, totalPayable - amountPaid);
  // const laonStatus = loan.status ?? '';

  const amountPaid = totalPayable ?? 0;
  // const paymentLeft = Math.max(0, totalPayable - amountPaid);
  const laonStatus = loan.status ?? '';

  // const paymentLeft = 10000;
  // const laonStatus = 'overdue';
  // const isOverdue = laonStatus?.toLowerCase() === 'overdue';
  const isOverdue = getActiveLoanStatusPill(loan) === 'Overdue';

  const totalPayableWithoutBouncePenalty = loan.totalPayable ?? 0;

  const [paymentOption, setPaymentOption] = useState<PaymentOption>('full');
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [customAmountTouched, setCustomAmountTouched] = useState(false);

  // Reset custom amount when parent signals (e.g. user returned to screen after payment)
  useEffect(() => {
    if (resetCustomAmountKey != null) {
      setCustomAmountInput('');
      setCustomAmountTouched(false);
    }
  }, [resetCustomAmountKey]);

  const customAmount = useMemo(
    () => parseDecimalAmount(customAmountInput),
    [customAmountInput]
  );
  const isValidCustom =
    customAmount >= MIN_CUSTOM_AMOUNT && customAmount <= paymentLeft;
  const showCustomError = customAmountTouched && customAmountInput.length > 0 && !isValidCustom;

  const customErrorMessage = useMemo(() => {
    if (!showCustomError) return null;
    if (customAmount > paymentLeft) {
      return `Amount cannot exceed ${formatCurrency(paymentLeft)}`;
    }
    if (customAmount > 0 && customAmount < MIN_CUSTOM_AMOUNT) {
      return `Please enter a valid amount greater than ${formatCurrency(MIN_CUSTOM_AMOUNT)}`;
    }
    if (customAmount === 0) {
      return `Please enter a valid amount between ${formatCurrency(MIN_CUSTOM_AMOUNT)} and ${formatCurrency(paymentLeft)}`;
    }
    return null;
  }, [showCustomError, customAmount, paymentLeft]);

  const remainingBalance = Math.max(0, paymentLeft - customAmount);

  const percentageAmounts = useMemo(
    () =>
      PERCENTAGES.map((p) => ({
        pct: p,
        amount: Math.round((paymentLeft * p) / 100),
      })),
    [paymentLeft]
  );

  const fixedAmountsFiltered = useMemo(
    () => FIXED_AMOUNTS.filter((a) => a <= paymentLeft),
    [paymentLeft]
  );

  const setCustomAmount = useCallback((amount: number): void => {
    const capped = Math.min(paymentLeft, Math.max(0, amount));
    setCustomAmountInput(String(capped));
    setCustomAmountTouched(true);
  }, [paymentLeft]);

  const handleCustomAmountChange = useCallback(
    (text: string): void => {
      if (text.trim() === '') {
        setCustomAmountInput('');
        return;
      }
      const num = parseDecimalAmount(text);
      const clamped = Math.min(paymentLeft, Math.max(0, num));
      const rounded = Math.round(clamped * 100) / 100;
      setCustomAmountInput(formatAmountForInput(rounded));
    },
    [paymentLeft]
  );

  const handleCtaPress = useCallback((): void => {
    if (paymentOption === 'full') {
      onPaymentPress(paymentLeft);
      return;
    }
    setCustomAmountTouched(true);
    if (!isValidCustom) return;
    onPaymentPress(customAmount);
  }, [paymentOption, paymentLeft, customAmount, isValidCustom, onPaymentPress]);

  const ctaLabel =
    paymentOption === 'full'
      ? t('Pay Full Amount {{amount}}', { amount: formatCurrency(paymentLeft) })
      : t('Pay Custom Amount {{amount}}', { amount: formatCurrency(customAmount) });
  const ctaDisabled =
    ctaLoading || (paymentOption === 'custom' && !isValidCustom);
  const disclaimerText = isOverdue
    ? 'This will clear your complete outstanding balance'
    : 'Full payment required for active loans';

  const tenureDays = loan.tenure ? `${loan.tenure} days` : 'N/A';
  const interestDisplay =
    loan.interestRate != null ? `${loan.interestRate}%` : 'N/A';

  return (
    <View style={styles.card}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: STICKY_FOOTER_PADDING }]}
        showsVerticalScrollIndicator={false}
      >
        <LoanApplicationHeader
          applicationDisplay={getApplicationDisplay(loan)}
          status={laonStatus}
          style={styles.applicationHeader}
        />

        <View style={styles.details}>
        <LoanDetailRow label="Principal Amount" value={formatCurrency(loan.amount)} />
        <LoanDetailRow label="Loan Tenure" value={tenureDays} />
        <LoanDetailRow label="Disbursed on" value={getDisbursedDateString(loan)} />
        <LoanDetailRow label="Due Date" value={formatLoanDate(loan.dueDate)} />
        <LoanDetailRow label="Interest (per day)" value={interestDisplay} />
        {isOverdue ? (
          <>
            <LoanDetailRow
              label="Payable at Due Date"
              value={formatCurrency(totalPayableWithoutBouncePenalty)}
            />
            <LoanDetailRow
              label="Bounce Amount"
              value={formatCurrency(loan.bounceAmount ?? 0)}
            />
            <LoanDetailRow
              label="Penalty Amount"
              value={formatCurrency(loan.totalPenaltyAmount ?? 0)}
            />
          </>
        ) : (
          <LoanDetailRow
            label="Total payable"
            value={formatCurrency(totalPayable)}
          />
        )}
      </View>
      <AmountSummaryBox
        label="Total Amount Due"
        amount={formatCurrency(amountPayment)}
      />
      <View style={styles.divider} />
      <LoanDetailRow label="Amount Paid" value={formatCurrency(totalAmountPaid)} />
      <LoanDetailRow label="Payment Left" value={formatCurrency(paymentLeft)} />
      <AppText variant="body" weight="semiBold" style={styles.sectionTitle}>
        Payment Options
      </AppText>
      {isOverdue ? (
        <>
          <RadioGroup<PaymentOption>
            options={[
              {
                value: 'full',
                label: 'Pay Full Amount',
                description: formatCurrency(paymentLeft),
              },
              { value: 'custom', label: 'Pay Custom Amount' },
            ]}
            value={paymentOption}
            onChange={setPaymentOption}
            variant="card"
            disabled={ctaLoading}
            style={styles.radioGroup}
          />
          {paymentOption === 'custom' ? (
            <View style={styles.customSection}>
              <AppText variant="body" weight="semiBold" style={styles.sectionTitle}>
                Quick Amount Options
              </AppText>
              <AppText variant="caption" color="textprimary" style={styles.quickLabel}>
                Pay by Percentage:
              </AppText>
              <View style={styles.quickRow}>
                {percentageAmounts.map(({ pct, amount }) => (
                  <TouchableOpacity
                    key={pct}
                    style={styles.quickChip}
                    onPress={() => setCustomAmount(amount)}
                    activeOpacity={0.7}
                  >
                    <AppText variant="caption" weight="semiBold" style={styles.quickChipText}>
                      {pct}%
                    </AppText>
                    <AppText variant="captionSmall" color="textprimary">
                      {formatCurrency(amount)}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
              <AppText variant="caption" color="textprimary" style={styles.quickLabel}>
                Fixed Amounts:
              </AppText>
              <View style={styles.quickRow}>
                {fixedAmountsFiltered.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickChip}
                    onPress={() => setCustomAmount(amount)}
                    activeOpacity={0.7}
                  >
                    <AppText variant="caption" weight="semiBold" style={styles.quickChipText}>
                      {formatCurrency(amount)}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
              <AppText variant="caption" weight="semiBold" style={styles.sectionTitle}>
                Or Enter Custom Amount
              </AppText>
              <AppText variant="captionSmall" color="textprimary" style={styles.rangeHint}>
                ({formatCurrency(MIN_CUSTOM_AMOUNT)} - {formatCurrency(paymentLeft)})
              </AppText>
              <View
                style={[
                  styles.inputRow,
                  showCustomError && styles.inputRowError,
                ]}
              >
                <AppText variant="body" weight="semiBold" color="textprimary" style={styles.rupee}>
                  ₹
                </AppText>
                <TextInput
                  style={styles.input}
                  value={customAmountInput}
                  onChangeText={handleCustomAmountChange}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="decimal-pad"
                  onBlur={() => setCustomAmountTouched(true)}
                  accessibilityLabel="Custom amount to pay"
                />
              </View>
              {customErrorMessage ? (
                <AppText variant="captionSmall" color="error" style={styles.validationError}>
                  {customErrorMessage}
                </AppText>
              ) : null}
              <AppText variant="captionSmall" color="tertiary" style={styles.remainingHint}>
                {t('Remaining balance after payment: {{amount}}', { amount: formatCurrency(remainingBalance) })}
              </AppText>
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <AppText variant="body" weight="semiBold" color="textprimary">
                    Amount to Pay:
                  </AppText>
                  <AppText variant="body" weight="bold">
                    {formatCurrency(customAmount)}
                  </AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="body" weight="semiBold" color="textprimary">
                    Remaining Balance:
                  </AppText>
                  <AppText variant="body" weight="bold">
                    {formatCurrency(remainingBalance)}
                  </AppText>
                </View>
              </View>
            </View>
          ) : null}
          </>
        ) : null}
        {/* <AppText variant="captionSmall" color="textprimary" style={styles.nbfcDisclaimer}>
          {NBFC_DISCLAIMER}
        </AppText> */}
      </ScrollView>
      {/* <StickyFooter> */}
        <ErrorContainer 
          responseError={ctaError ?? ''}
        />
        <Button
          title={ctaLoading ? '' : ctaLabel}
          onPress={handleCtaPress}
          loading={ctaLoading}
          disabled={ctaDisabled}
          fullWidth
          style={styles.cta}
        />

      {/* </StickyFooter> */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background.primary,
    // borderRadius: radius.lg,
    // borderWidth: 1,
    // borderColor: colors.border.light,
    // padding: spacing.lg,
    // ...shadows.sm,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    // paddingBottom handled by STICKY_FOOTER_PADDING
  },
  applicationHeader: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  applicationId: {
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  details: {
    gap: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  radioGroup: {
    marginBottom: spacing.md,
  },
  customSection: {
    marginBottom: spacing.md,
  },
  quickLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    // backgroundColor: 'red'
  },
  quickChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickChipText: {
    color: colors.text.primary,
  },
  rangeHint: {
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.lightest_3,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    marginTop: spacing.xs,
  },
  inputRowError: {
    borderColor: colors.error.main,
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
  validationError: {
    marginTop: spacing.xs,
  },
  remainingHint: {
    marginTop: spacing.sm,
  },
  summaryBox: {
    marginTop: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.primary.lightest_3,
    borderRadius: radius.md,
    // borderWidth: 1,
    // borderColor: colors.primary.main,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  disclaimerText: {
    marginTop: spacing.sm,
  },
  ctaError: {
    marginTop: spacing.sm,
  },
  nbfcDisclaimer: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  cta: {
    marginVertical: spacing.md,
  },
});
