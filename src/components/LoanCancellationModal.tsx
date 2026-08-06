import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  CancellationConfirmFooter,
  CancellationConfirmStep,
} from './loan-cancellation/CancellationConfirmStep';
import { CancellationSuccessStep } from './loan-cancellation/CancellationSuccessStep';
import { LoanCancellationShell } from './loan-cancellation/LoanCancellationShell';
import type { CancellationStep } from './loan-cancellation/types';
import { useCancelLoanSubmit } from '@/src/services/loans';
import { goHomeWithFallback } from '@/src/services/navigation/homeNavigation';

export interface LoanCancellationModalProps {
  visible: boolean;
  /** Backend loan id for POST /loans/:loanId/cancel */
  loanId: string;
  onClose: () => void;
  /** Called after successful cancellation before navigating home */
  onLoanCancelled?: () => void;
}

const INITIAL_STEP: CancellationStep = 'confirm';

export function LoanCancellationModal({
  visible,
  loanId,
  onClose,
  onLoanCancelled,
}: LoanCancellationModalProps): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<CancellationStep>(INITIAL_STEP);

  const handleSubmitSuccess = useCallback(() => {
    // Show success step instead of navigating home immediately so the user
    // sees confirmation of the cancellation before leaving the modal.
    setStep('success');
  }, []);

  const {
    submitError,
    isSubmitting,
    handleSubmit,
    reset: resetSubmit,
  } = useCancelLoanSubmit(handleSubmitSuccess, loanId);

  useEffect(() => {
    if (!visible) {
      setStep(INITIAL_STEP);
      resetSubmit();
    }
  }, [visible, resetSubmit]);

  const handleRequestClose = useCallback(() => {
    // Block hardware/back close mid-request to avoid leaving the modal in an
    // ambiguous state while the cancel API is in flight.
    if (isSubmitting) {
      return;
    }
    onClose();
  }, [isSubmitting, onClose]);

  const handleKeepLoan = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    onClose();
  }, [isSubmitting, onClose]);

  const handleContinueHome = useCallback(() => {
    onLoanCancelled?.();
    onClose();
    goHomeWithFallback(router);
  }, [onLoanCancelled, onClose, router]);

  const stepKey = `${visible}-${step}`;

  if (step === 'success') {
    return (
      <LoanCancellationShell
        visible={visible}
        step={step}
        onRequestClose={handleRequestClose}
        fillBody
      >
        <CancellationSuccessStep key={stepKey} onContinueHome={handleContinueHome} />
      </LoanCancellationShell>
    );
  }

  return (
    <LoanCancellationShell
      visible={visible}
      step={step}
      onRequestClose={handleRequestClose}
      footer={
        <CancellationConfirmFooter
          isSubmitting={isSubmitting}
          onKeepLoan={handleKeepLoan}
          onConfirmCancel={handleSubmit}
        />
      }
    >
      <CancellationConfirmStep key={stepKey} submitError={submitError} />
    </LoanCancellationShell>
  );
}
