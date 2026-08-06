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
import type { PersonalDetails } from '@/src/types/registration';
import type { StepProps } from '@/src/types/flow';

const CORRECT_OTP = '123456';

function formatConfirmationData(data: PersonalDetails): ConfirmationModalData {
  return {
    Name: data.name,
    'Date of Birth': data.dob,
    Gender: data.gender.charAt(0).toUpperCase() + data.gender.slice(1),
    Pincode: data.pincode,
    'PAN Card Number': data.pan,
  };
}

export function EmailOtpStep({ onNext, onPrev }: StepProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationModalData | null>(null);

  useEffect(() => {
    // Note: PersonalDetails doesn't include email field
    // This step may need email to be added to PersonalDetails type if required
    const loadEmail = async () => {
      const data = await RegistrationService.getRegistrationData();
      // Email field not available in PersonalDetails type
      setEmail('');
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
      if (data?.personalDetails) {
        setConfirmationData(formatConfirmationData(data.personalDetails));
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
              {email || 'e.g. you@gmail.com'}
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
        message="Email verified successfully"
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
