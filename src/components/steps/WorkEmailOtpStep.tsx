import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../AppText';
import { OTPInput } from '../OTPInput';
import { Button } from '../Button';
import { CountdownTimer } from '../CountdownTimer';
import { SuccessModal } from '../SuccessModal';
import { FormLayout } from '../FormLayout';
import { ConfirmationModal, type ConfirmationModalData } from '../ConfirmationModal';
import { RegistrationService } from '@/src/services/registration';
import { colors, spacing } from '@/src/theme';
import type { EmploymentDetails } from '@/src/types/registration';
import type { StepProps } from '@/src/types/flow';

const CORRECT_OTP = '123456';

function getWorkEmailFromRegistration(
  data: Awaited<ReturnType<typeof RegistrationService.getRegistrationData>>
): string {
  if (!data?.employmentDetails) return '';
  const details = data.employmentDetails;
  if ('workEmail' in details && details.workEmail) return details.workEmail;
  if ('alternateEmail' in details && details.alternateEmail) return details.alternateEmail;
  return '';
}

function formatConfirmationData(data: EmploymentDetails): ConfirmationModalData {
  if ('companyName' in data) {
    return {
      'Company Name': data.companyName,
      'Net Monthly Income (INR)': `₹${data.netMonthlyIncome}`,
      'Work Email Address': data.workEmail ?? 'Not provided',
    };
  }
  if ('businessName' in data) {
    return {
      'Business or Firm Name': data.businessName,
      'Business Domain': data.businessDomain ?? 'Not provided',
      'Work Email Address': data.workEmail ?? 'Not provided',
    };
  }
  return {
    'What do you currently do?': data.currentActivity,
    'Alternate Personal Email Address': data.alternateEmail ?? 'Not provided',
  };
}

export function WorkEmailOtpStep({ onNext, onPrev }: StepProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationModalData | null>(null);

  useEffect(() => {
    const loadEmail = async () => {
      const data = await RegistrationService.getRegistrationData();
      setEmail(getWorkEmailFromRegistration(data));
    };
    loadEmail();
  }, []);

  useEffect(() => {
    if (otp.length === 6) {
      handleVerifyOTP();
    }
  }, [otp]);

  const handleVerifyOTP = async () => {
    setIsVerifying(true);
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (otp === CORRECT_OTP) {
      const data = await RegistrationService.getRegistrationData();
      if (data?.employmentDetails) {
        setConfirmationData(formatConfirmationData(data.employmentDetails));
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setShowConfirmationModal(true);
        }, 2000);
      } else {
        onNext();
      }
      setIsVerifying(false);
    } else {
      setError('Incorrect OTP. Try again.');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setOtp('');
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handleOTPChange = (value: string) => {
    setError('');
    setOtp(value);
  };

  const handleConfirmDetails = () => {
    setShowConfirmationModal(false);
    onNext();
  };

  const handleEditDetails = () => {
    setShowConfirmationModal(false);
    onPrev();
  };

  return (
    <>
      <FormLayout
        safeAreaEdges={['bottom']}
        onBack={onPrev}
        footer={
          <Button
            variant="primary"
            size="large"
            fullWidth
            disabled={otp.length !== 6 || isVerifying}
            loading={isVerifying}
            onPress={handleVerifyOTP}
          >
            Continue
          </Button>
        }
      >
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <AppText style={styles.title} variant="h3" weight="bold">
              Enter the OTP sent to
            </AppText>
            <AppText style={styles.emailText} variant="body" weight="medium">
              {email || 'your work email'}
            </AppText>
          </View>
          {error && (
            <View style={styles.errorContainer}>
              <AppText style={styles.errorText} variant="caption" weight="medium">
                {error}
              </AppText>
            </View>
          )}
          <View style={styles.otpContainer}>
            <OTPInput
              length={6}
              value={otp}
              onChange={handleOTPChange}
              disabled={isVerifying}
              hasError={!!error}
            />
          </View>
          <View style={styles.timerContainer}>
            <CountdownTimer
              initialSeconds={60}
              onResend={handleResend}
              textBefore="Didn't receive the OTP?"
              linkText="Resend"
            />
          </View>
        </View>
      </FormLayout>
      <SuccessModal
        visible={showSuccess}
        title="Verified!"
        message="Registration complete"
      />
      <ConfirmationModal
        visible={showConfirmationModal}
        title="Please re-confirm the details"
        data={confirmationData}
        onEdit={handleEditDetails}
        onConfirm={handleConfirmDetails}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing['2xl'],
  },
  titleContainer: {
    marginBottom: spacing['3xl'],
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emailText: {
    color: colors.text.secondary,
  },
  errorContainer: {
    marginBottom: spacing.base,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error.main,
  },
  otpContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
  },
});
