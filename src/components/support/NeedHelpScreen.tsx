import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormLayout } from '@/src/components/FormLayout';
import { Button } from '@/src/components/Button';
import { SuccessModal } from '@/src/components/SuccessModal';
import { ErrorModal } from '@/src/components/ErrorModal';
import { HOME_ROUTE } from '@/src/services/navigation/homeNavigation';
import {
  ControlledDropdown,
  ControlledInput,
} from '@/src/components/ControlledInput';
import { NeedHelpHeader } from './NeedHelpHeader';
import { NeedHelpAttachmentField } from './NeedHelpAttachmentField';
import { usePersonalDetails } from '@/src/hooks/usePersonalDetails';
import { useAllUserLoans } from '@/src/services/loans';
import { createCustomerTicket } from '@/src/services/support';
import {
  SUPPORT_ISSUE_OPTIONS,
  SUPPORT_ISSUE_VALUES,
  type SupportIssueValue,
} from '@/src/config/supportIssueOptions';
import { formatFullName } from '@/src/utils/profile-formatters';
import {
  getValidApplicationNumbers,
  toApplicationDropdownOptions,
} from '@/src/utils/supportApplicationOptions';
import { getApiErrorDisplayMessage } from '@/src/utils/common-helper';
import { spacing } from '@/src/theme';
import type { DocumentFile } from '@/src/utils/documentFilePicker';

const needHelpFormSchema = z.object({
  applicationNumber: z.string().trim().optional(),
  issueCategory: z.enum(SUPPORT_ISSUE_VALUES).optional(),
  subject: z.string().trim().min(1, 'Enter an issue subject'),
  description: z.string().trim().optional(),
});

export type NeedHelpFormValues = {
  applicationNumber?: string;
  issueCategory?: SupportIssueValue;
  subject: string;
  description?: string;
};

const defaultFormValues: NeedHelpFormValues = {
  applicationNumber: undefined,
  issueCategory: undefined,
  subject: '',
  description: '',
};

/** Stable scroll props — avoid KeyboardAwareScrollView reconfig on each keystroke. */
const NEED_HELP_SCROLL_VIEW_PROPS = {
  enableAutomaticScroll: false,
  keyboardOpeningTime: 0,
} as const;

/**
 * Native Need Help form (header + fields + submit).
 */
export function NeedHelpScreen(): React.JSX.Element {
  const router = useRouter();
  const { personalDetails } = usePersonalDetails();
  const { data: loansData, isLoading: isLoansLoading, refetch } = useAllUserLoans();
  const [attachments, setAttachments] = useState<DocumentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const showErrorModal = useCallback((message: string) => {
    setErrorModalMessage(message);
    setIsErrorModalVisible(true);
  }, []);

  const handleSuccessClose = useCallback(() => {
    setIsSuccessModalVisible(false);
    router.replace(HOME_ROUTE);
  }, [router]);

  useFocusEffect(
    React.useCallback(() => {
      if (loansData?.loans?.length === 0) {
        refetch();
      }
    }, [refetch, loansData?.loans?.length])
  );

  const { control, handleSubmit, reset } = useForm<NeedHelpFormValues>({
    resolver: zodResolver(needHelpFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const applicationOptions = useMemo(
    () => toApplicationDropdownOptions(getValidApplicationNumbers(loansData?.loans)),
    [loansData?.loans]
  );

  const showApplicationDropdown =
    !isLoansLoading && applicationOptions.length > 0;

  const greetingFirstName = useMemo(() => {
    const fromField = personalDetails?.firstName?.trim();
    if (fromField) return fromField;
    const full = formatFullName(
      personalDetails?.firstName,
      personalDetails?.middleName,
      personalDetails?.lastName
    );
    if (!full || full === 'N/A') return undefined;
    const first = full.split(/\s+/)[0]?.trim();
    return first || undefined;
  }, [personalDetails]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const fixedHeader = useMemo(
    () => (
      <NeedHelpHeader
        greetingFirstName={greetingFirstName}
        onBack={handleBack}
      />
    ),
    [greetingFirstName, handleBack]
  );

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmitting) return;

    const phoneNumber = personalDetails?.phoneNumber?.trim();
    if (!phoneNumber) {
      showErrorModal(
        'Your phone number is not available. Please try again later or contact support.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationNumber =
        showApplicationDropdown && data.applicationNumber?.trim()
          ? data.applicationNumber.trim()
          : undefined;

      const response = await createCustomerTicket({
        phoneNumber,
        subject: data.subject,
        description: data.description?.trim() || undefined,
        issueCategory: data.issueCategory,
        applicationNumber,
        files: attachments.length > 0 ? attachments : undefined,
      });

      if (!response.success) {
        const message =
          getApiErrorDisplayMessage(response.error) ||
          'Could not submit your request. Please try again.';
        showErrorModal(message);
        return;
      }

      reset(defaultFormValues);
      setAttachments([]);
      setIsSuccessModalVisible(true);
    } catch {
      showErrorModal(
        'Something went wrong. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const footer = useMemo(
    () => (
      <Button
        variant="primary"
        size="large"
        fullWidth
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        accessibilityLabel="Submit support request"
      >
        Submit
      </Button>
    ),
    [onSubmit, isSubmitting]
  );

  return (
    <>
    <FormLayout
      safeAreaEdges={['bottom']}
      fixedHeader={fixedHeader}
      keyboardAwareFooter
      showFooterBorder
      contentContainerStyle={styles.scrollContent}
      footerStyle={styles.footer}
      scrollViewProps={NEED_HELP_SCROLL_VIEW_PROPS}
      footer={footer}
    >
      <View style={styles.formBlock}>
        {showApplicationDropdown ? (
          <ControlledDropdown<NeedHelpFormValues, string>
            control={control}
            name="applicationNumber"
            label="APPLICATION NUMBER"
            options={applicationOptions}
            placeholder="Select application number"
          />
        ) : null}
        <ControlledDropdown<NeedHelpFormValues, SupportIssueValue>
          control={control}
          name="issueCategory"
          label="SELECT ISSUE"
          options={SUPPORT_ISSUE_OPTIONS}
          placeholder="Select an issue category"
        />
        <ControlledInput
          control={control}
          name="subject"
          label="SUBJECT"
          placeholder="Enter an issue subject"
          required
        />
        <ControlledInput
          control={control}
          name="description"
          label="DESCRIPTION"
          placeholder="Please describe your concern in detail..."
          multiline
          style={styles.descriptionInput}
        />
        <NeedHelpAttachmentField
          files={attachments}
          onChange={setAttachments}
          disabled={isSubmitting}
        />
      </View>
    </FormLayout>
    <SuccessModal
      visible={isSuccessModalVisible}
      centered
      title="Submitted"
      message="Thank you. We have received your message and will get back to you soon."
      onClose={handleSuccessClose}
      closeLabel="OK"
    />
    <ErrorModal
      visible={isErrorModalVisible}
      title="Submission failed"
      message={errorModalMessage}
      onClose={() => setIsErrorModalVisible(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
  formBlock: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  descriptionInput: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
});
