import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useScrollToFirstError } from '@/hooks/useScrollToFirstError';
import type { ScrollViewScrollToFocusedInput } from '@/hooks/useScrollToFirstError';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppText } from '../AppText';
import { ControlledInput, ControlledDateInput, ControlledRadioGroup } from '../ControlledInput';
import { Button } from '../Button';
import { ConfirmationSheet, type ConfirmationField } from '../ConfirmationSheet';
import { FormLayout } from '../FormLayout';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  RegistrationService,
  personalDetailsSchema,
  postPersonalDetails,
  mapPersonalDetailsToApi,
  getPersonalDetails,
  mapPersonalDetailsFromApi,
  createRegistrationSubmit,
  handleRegistrationStepSuccess,
} from '@/src/services/registration';
import { devLog } from '@/src/utils';
import { getApiErrorDisplayMessage, getRejectionMessage } from '@/src/utils/common-helper';
import { GENDER_OPTIONS } from '@/src/data/registration';
import type { PersonalDetails } from '@/src/types/registration';
import type { StepProps } from '@/src/types/flow';
import { colors, spacing } from '@/src/theme';
import { useRegistrationSubmit } from '@/hooks/useRegistrationSubmit';
import { useFlowStore } from '@/src/store/useFlowStore';
import ErrorContainer from '../ErrorContainer';
import { appConfig } from '@/src/config/appConfig';
import { REGISTRATION_ERROR_MESSAGES } from '@/src/services/registration/registrationSubmit';
import { UserStagesInBackend, type UserStage } from '@/src/config/userStages';
import { useIneligibilityModal } from '@/hooks/useIneligibilityModal';
import { ConsentNotice } from '../ConsentNotice';
import { ANALYTICS_EVENT, logAnalyticsEvent } from '@/src/services/analytics';
import { pushLoanJourneyApiError } from '@/src/services/logging/logPoolJourney';
import { ShieldCheck } from 'lucide-react-native';

type PersonalDetailsFormData = z.input<typeof personalDetailsSchema>;

const PERSONAL_FIELD_ORDER: (keyof PersonalDetailsFormData)[] = [
  'pan',
  'pincode',
  'dob',
  'gender',
  'salary',
];

const submitPersonalDetails = createRegistrationSubmit<PersonalDetails, ReturnType<typeof mapPersonalDetailsToApi>>({
  useMock: appConfig.useMockApi,
  mockSave: (data) => RegistrationService.savePersonalDetails(data),
  mapToPayload: mapPersonalDetailsToApi,
  apiCall: postPersonalDetails,
});

const extractRejectReason = (data: unknown): string => getRejectionMessage(data);

const formatGenderLabel = (gender: PersonalDetails['gender'] | undefined): string => {
  if (!gender) return '';
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

const formatCurrencyINR = (raw: string | undefined): string => {
  const value = (raw ?? '').trim();
  if (!value) return '';
  const numeric = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(numeric)) return value;
  return `₹${numeric.toLocaleString('en-IN')}`;
};

const mapPersonalDetailsToConfirmationFields = (data: PersonalDetails): ConfirmationField[] => [
  { label: 'PAN Number', value: data.pan || '-' },
  { label: 'Pincode', value: data.pincode || '-' },
  { label: 'Date of Birth', value: data.dob || '-' },
  { label: 'Gender', value: formatGenderLabel(data.gender) || '-' },
  { label: 'Monthly Income', value: formatCurrencyINR(data.salary) || '-' },
];

export function PersonalDetailsStep({ onNext, onPrev }: StepProps) {
  // Backend stages reference (see src/config/userStages.ts)
  // PERSONAL_DETAILS, MODE_OF_EMPLOYMENT, SOFT_PULL, BANK_STATEMENT, OFFERINGS,
  // CONTACT_DETAILS, ADDRESS_DETAILS, FAMILY_REFERENCE, BANK_DETAILS, AADHAAR_KYC,
  // FACE_KYC, APPLICATION_STATUS, ACTIVE_LOAN_DASHBOARD, CBL_JOURNEY, REJECTED, ENACH,
  // ESIGN, WAITING_FOR_DISBURSEMENT
  const currentStage: UserStage = UserStagesInBackend.PERSONAL_DETAILS;
  const syncFromUserStage = useFlowStore((s) => s.syncFromUserStage);
  const { handleFailedResponse } = useIneligibilityModal();
  const [pendingData, setPendingData] = useState<PersonalDetails | null>(null);
  const didAttemptConfirmRef = useRef(false);

  // Refs for input fields and scroll view
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const panInputRef = useRef<TextInput>(null);
  const pincodeInputRef = useRef<TextInput>(null);
  const dobInputRef = useRef<TextInput>(null);
  const salaryInputRef = useRef<TextInput>(null);

  const personalFieldRefs = useMemo(
    () => ({
      pan: panInputRef,
      pincode: pincodeInputRef,
      dob: dobInputRef,
      salary: salaryInputRef,
    }),
    []
  );
  const onValidationError = useScrollToFirstError<PersonalDetailsFormData>(
    PERSONAL_FIELD_ORDER,
    personalFieldRefs,
    scrollViewRef as React.RefObject<ScrollViewScrollToFocusedInput | null>
  );

  const { submit, isPending, errorMessage, clearError, setErrorMessage } =
    useRegistrationSubmit<PersonalDetails>({
      mutationFn: submitPersonalDetails,
      onSuccess: () => {
        didAttemptConfirmRef.current = false;
        setPendingData(null);
        void logAnalyticsEvent(ANALYTICS_EVENT.PERSONAL_DETAIL_PAGE_SUBMIT);
        void handleRegistrationStepSuccess({
          currentStage,
          onNext,
          syncFromUserStage,
        });
      },
      onFailedResponse: (data) => {
        didAttemptConfirmRef.current = false;
        setPendingData(null);
        return handleFailedResponse(data);
      },
    });

  const { control, handleSubmit, reset } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      name: '',
      dob: appConfig.prefillPersonalWithPiyushData ? '30/11/1985' : '',
      gender: appConfig.prefillPersonalWithPiyushData ? 'male' : undefined,
      pincode: appConfig.prefillPersonalWithPiyushData ? '311404' : '',
      pan: '',
      salary: appConfig.prefillPersonalWithPiyushData ? '51000' : '',
    },
  });

  useEffect(() => {
    devLog.screenEnter('personal-details');
    const loadSavedData = async () => {
      // const saved = await RegistrationService.getRegistrationData();
      // if (saved?.personalDetails) {
      //   reset(saved.personalDetails);
      //   return;
      // }

      const response = await getPersonalDetails();
      if (!response.success) {
        pushLoanJourneyApiError(
          'personal details prefetch',
          response.error,
          response.status
        );
        setErrorMessage(
          getApiErrorDisplayMessage(response.error) || REGISTRATION_ERROR_MESSAGES.generic
        );
        return;
      }

      const mapped = mapPersonalDetailsFromApi(response.data);
      const rejectReason = extractRejectReason(response.data);
      if (rejectReason) {
        setErrorMessage(rejectReason);
      }
      const hasValues = Object.values(mapped).some((value) => value && value !== '');
      if (hasValues) {
        await RegistrationService.savePersonalDetails(mapped);
        reset(mapped);
      }
    };
    loadSavedData();
    return () => devLog.screenLeave('personal-details');
  }, [reset, setErrorMessage]);

  useEffect(() => {
    // If the confirm attempt fails (API error), close the sheet so the user sees the inline error.
    if (!didAttemptConfirmRef.current) return;
    if (isPending) return;
    if (!errorMessage) return;
    didAttemptConfirmRef.current = false;
    setPendingData(null);
  }, [errorMessage, isPending]);

  const onReview = (data: PersonalDetailsFormData) => {
    clearError();
    // Schema transforms name from optional to required (empty string)
    const transformedData = personalDetailsSchema.parse(data);
    devLog.formData('Personal Details', transformedData);
    setPendingData(transformedData as PersonalDetails);
  };

  const handleConfirm = () => {
    if (!pendingData) return;
    didAttemptConfirmRef.current = true;
    clearError();
    submit(pendingData);
  };

  const handleEdit = () => {
    didAttemptConfirmRef.current = false;
    setPendingData(null);
  };

  // Handle moving to next field when "next" is pressed on keyboard
  // KeyboardAwareScrollView with enableAutomaticScroll will automatically scroll to focused inputs
  const handlePanNext = () => {
    pincodeInputRef.current?.focus();
  };

  const handlePincodeNext = () => {
    dobInputRef.current?.focus();
  };

  const handleDobNext = () => {
    salaryInputRef.current?.focus();
  };

  return (
    <>
      <FormLayout
        ref={scrollViewRef}
        safeAreaEdges={['bottom']}
        keyboardAwareFooter
        onBack={onPrev}
        footer={
          <>
            <ErrorContainer responseError={errorMessage} />
            <ConsentNotice
              hideLockIcon={true}
              text="Your details are safe and encrypted"
              icon={<ShieldCheck size={18} color={colors.primary.main} />}
            />
            <Button
              variant="primary"
              size="large"
              fullWidth
              style={styles.nextButton}
              textStyle={styles.nextButtonText}
              disabled={isPending}
              loading={isPending}
              onPress={handleSubmit(onReview, onValidationError)}
            >
              Next →
            </Button>
          </>
        }
      >
        <AppText style={styles.title} variant="h4" weight="semiBold">
          Complete Your Basic Details
        </AppText>
        <AppText style={styles.subtext} variant="caption" color='textprimary'>
        This helps us check your loan eligibility instantly
        </AppText>
        <View style={styles.content}>
          <ControlledInput
            control={control}
            name="pan"
            label="PAN Number"
            placeholder="Enter your PAN number"
            autoCapitalize="characters"
            maxLength={10}
            required
            inputRef={panInputRef}
            returnKeyType="next"
            onSubmitEditing={handlePanNext}
          />
          <ControlledInput
            control={control}
            name="pincode"
            label="Pincode"
            placeholder="Enter your pincode"
            keyboardType="number-pad"
            maxLength={6}
            required
            inputRef={pincodeInputRef}
            returnKeyType="next"
            onSubmitEditing={handlePincodeNext}
          />
          <ControlledDateInput
            control={control}
            name="dob"
            label="Date of Birth (as per PAN)"
            required
            inputRef={dobInputRef}
            returnKeyType="next"
            onSubmitEditing={handleDobNext}
          />
          <View style={{ marginBottom: spacing.lg }}>
            <ControlledRadioGroup
              control={control}
              name="gender"
              options={GENDER_OPTIONS}
              label="Gender"
              variant="row"
              accentColor={colors.primary.main}
            />
          </View>
          <ControlledInput
            control={control}
            name="salary"
            label="Monthly Income (₹)"
            placeholder="e.g. 40000"
            keyboardType="number-pad"
            required
            inputRef={salaryInputRef}
            returnKeyType="done"
          />
        </View>
      </FormLayout>

      <ConfirmationSheet
        visible={pendingData !== null}
        title="Please confirm your details"
        data={pendingData ? mapPersonalDetailsToConfirmationFields(pendingData) : null}
        onEdit={handleEdit}
        onClose={handleEdit}
        onConfirm={handleConfirm}
        editLabel="Edit details"
        confirmLabel="Confirm"
        confirmLoading={isPending}
        accentColor={colors.primary.main}
      />

      {/* Shown on top of loan-journey when the user is found ineligible */}

    </>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text.primary,
    // marginBottom: spacing.base,
  },
  subtext: {
    color: colors.text.secondary,
    marginVertical: spacing.sm,
  },
  errorContainer: {
    marginBottom: spacing.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.error.light ?? '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    color: colors.error.main,
    textAlign: 'center',
  },
  content: {
    // paddingTop: spacing.base,
  },
  nextButtonText: {
    color: colors.text.black,
  },
  nextButton: {
    marginBottom: 0,
    backgroundColor: colors.primary.main,
  },
});
