import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, View, StyleSheet, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Download } from 'lucide-react-native';
import type ReactNativeBlobUtilDefault from 'react-native-blob-util';
import { colors, spacing, typography } from '@/src/theme';
import {
  AppText,
  FormLayout,
  ControlledInput,
  ControlledDateInput,
  PhoneInput,
  Checkbox,
  Button,
  ConsentNotice,
} from '@/src/components';
import ErrorContainer from '../ErrorContainer';
import {
  creditScoreSchema,
  useGromoEquifaxPull,
  type CreditScoreFormData,
} from '@/src/services/creditScore';
import { convertDdMmYyyyToIso } from '@/src/utils/common-helper';
import {
  useScrollToFirstError,
  type ScrollViewScrollToFocusedInput,
} from '@/hooks/useScrollToFirstError';
import { envConfig } from '@/src/config/envConfig';

const DOWNLOAD_PDF_ERROR = 'Could not download your credit report. Please try again.';
const CREDIT_REPORT_FILE_NAME = 'zapcash-credit-report.pdf';
const PDF_REQUEST_HEADERS = {
  Accept: 'application/pdf,*/*',
};

type ReactNativeBlobUtilModule = typeof ReactNativeBlobUtilDefault;

const CREDIT_SCORE_FIELD_ORDER: (keyof CreditScoreFormData)[] = [
  'fullName',
  'panNumber',
  'dob',
  'mobileNumber',
  'email',
  'monthlyIncome',
  'consent',
];

const loadReactNativeBlobUtil = async (): Promise<ReactNativeBlobUtilModule | null> => {
  try {
    const blobUtilImport = await import('react-native-blob-util');
    return blobUtilImport.default;
  } catch (blobUtilError) {
    if (__DEV__) {
      console.warn('[CreditScore] PDF download module unavailable', blobUtilError);
    }
    return null;
  }
};

export function CreditScoreForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const fullNameRef = useRef<TextInput>(null);
  const panNumberRef = useRef<TextInput>(null);
  const dobRef = useRef<TextInput>(null);
  const mobileNumberRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const monthlyIncomeRef = useRef<TextInput>(null);

  const fieldRefs = useMemo(
    () => ({
      fullName: fullNameRef,
      panNumber: panNumberRef,
      dob: dobRef,
      mobileNumber: mobileNumberRef,
      email: emailRef,
      monthlyIncome: monthlyIncomeRef,
    }),
    []
  );

  const onValidationError = useScrollToFirstError<CreditScoreFormData>(
    CREDIT_SCORE_FIELD_ORDER,
    fieldRefs,
    scrollViewRef as React.RefObject<ScrollViewScrollToFocusedInput | null>
  );

  const { control, handleSubmit, formState: { isValid } } = useForm<CreditScoreFormData>({
    resolver: zodResolver(creditScoreSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: envConfig.isDevelopment ? 'Piyush Beli' : '',
      panNumber: envConfig.isDevelopment ? 'ABCDE1234F' : '',
      dob: envConfig.isDevelopment ? '01/01/1990' : '',
      mobileNumber: envConfig.isDevelopment ? '9876543210' : '',
      email: envConfig.isDevelopment ? 'test@test.com' : '',
      monthlyIncome: envConfig.isDevelopment ? '10000' : '',
      consent: true,
    },
  });

  const { mutate, isPending, error } = useGromoEquifaxPull();

  const focusPanNumber = useCallback(() => {
    panNumberRef.current?.focus();
  }, []);

  const focusDob = useCallback(() => {
    dobRef.current?.focus();
  }, []);

  const focusMobileNumber = useCallback(() => {
    mobileNumberRef.current?.focus();
  }, []);

  const focusEmail = useCallback(() => {
    emailRef.current?.focus();
  }, []);

  const focusMonthlyIncome = useCallback(() => {
    monthlyIncomeRef.current?.focus();
  }, []);

  const handleDownloadPdf = async () => {
    if (!pdfUrl) return;
    setDownloadError('');
    setDownloadMessage('');
    setIsDownloading(true);
    try {
      const ReactNativeBlobUtil = await loadReactNativeBlobUtil();
      if (!ReactNativeBlobUtil) {
        throw new Error('PDF download module is unavailable');
      }

      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            mediaScannable: true,
            storeInDownloads: true,
            title: CREDIT_REPORT_FILE_NAME,
            description: 'Zapcash credit report',
            mime: 'application/pdf',
          },
        }).fetch('GET', pdfUrl, PDF_REQUEST_HEADERS);
      } else {
        const filePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${CREDIT_REPORT_FILE_NAME}`;
        const response = await ReactNativeBlobUtil.config({
          path: filePath,
          overwrite: true,
        }).fetch('GET', pdfUrl, PDF_REQUEST_HEADERS);

        const status = response.info().status;
        if (status < 200 || status >= 300) {
          throw new Error(`PDF download failed with status ${status}`);
        }
      }

      setDownloadMessage('PDF downloaded successfully.');
    } catch (pdfError) {
      if (__DEV__) {
        console.error('[CreditScore] PDF download failed', pdfError);
      }
      setDownloadError(DOWNLOAD_PDF_ERROR);
    } finally {
      setIsDownloading(false);
    }
  };

  const onSubmit = (data: CreditScoreFormData) => {
    setDownloadError('');
    setDownloadMessage('');
    mutate(
      {
        fullName: data.fullName,
        panNumber: data.panNumber,
        dob: convertDdMmYyyyToIso(data.dob),
        mobileNumber: data.mobileNumber,
        consent: data.consent,
      },
      {
        onSuccess: (result) => {
          const url = result?.pdfUrl?.trim();
          if (!url) {
            setDownloadError(DOWNLOAD_PDF_ERROR);
            return;
          }
          setDownloadError('');
          setDownloadMessage('');
          setPdfUrl(url);
        },
      }
    );
  };

  if (pdfUrl) {
    return (
      <FormLayout
        footer={null}
        safeAreaEdges={['bottom']}
        contentContainerStyle={styles.successContent}
      >
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={56} color={colors.success.main} />
          </View>
          <AppText variant="h3" weight="bold" color="textprimary" align="center" style={styles.successTitle}>
            Thank you
          </AppText>
          <AppText variant="body" color="textprimary" align="center" style={styles.successMessage}>
            Your credit report is ready. Download the PDF to view and save it.
          </AppText>
          {downloadMessage ? (
            <View style={styles.downloadSuccessBox}>
              <AppText variant="caption" color="success" align="center" weight="semiBold">
                {downloadMessage}
              </AppText>
            </View>
          ) : null}
          <ErrorContainer responseError={downloadError} />
          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={isDownloading}
            disabled={isDownloading}
            leftIcon={<Download size={20} color={colors.text.inverse} />}
            onPress={handleDownloadPdf}
          >
            Download PDF
          </Button>
        </View>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      ref={scrollViewRef}
      keyboardAwareFooter
      safeAreaEdges={['bottom']}
      header={
        <View style={styles.titleContainer}>
          <AppText variant="h3" weight="bold" color="textprimary" style={styles.title}>
            Check your credit score
          </AppText>
          <AppText variant="caption" color="textprimary" style={styles.subtitle}>
            {"Free & won't affect your score. We just need a few details to fetch your Equifax report."}
          </AppText>
        </View>
      }
      footer={
        <>
          <ErrorContainer responseError={error?.message || ''} />
          <ConsentNotice containerStyle={styles.consentContainer} text="256-bit encrypted. Powered by Equifax" />
          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={isPending}
            disabled={isPending || !isValid}
            onPress={handleSubmit(onSubmit, onValidationError)}
          >
            Get my credit score
          </Button>
        </>
      }
    >
      <View style={styles.formContainer}>
        <ControlledInput
          control={control}
          name="fullName"
          label="Full Name"
          placeholder="As per PAN Card"
          inputRef={fullNameRef}
          returnKeyType="next"
          onSubmitEditing={focusPanNumber}
          required
        />
        <ControlledInput
          control={control}
          name="panNumber"
          label="PAN Number"
          placeholder="Enter Your PAN Number"
          autoCapitalize="characters"
          maxLength={10}
          inputRef={panNumberRef}
          returnKeyType="next"
          onSubmitEditing={focusDob}
          required
        />
        <ControlledDateInput
          control={control}
          name="dob"
          label="Date of Birth"
          inputRef={dobRef}
          returnKeyType="next"
          onSubmitEditing={focusMobileNumber}
          required
        />
        <View>
          <AppText style={styles.phoneLabel}>Phone Number</AppText>
          <Controller
            control={control}
            name="mobileNumber"
            render={({ field: { value, onChange }, fieldState: { error: fieldError } }) => (
              <PhoneInput
                value={value ?? ''}
                onChange={onChange}
                placeholder="9876543210"
                hasError={!!fieldError}
                errorMessage={fieldError?.message}
                inputRef={mobileNumberRef}
                returnKeyType="next"
                onSubmitEditing={focusEmail}
              />
            )}
          />
        </View>
        <ControlledInput
          control={control}
          name="email"
          label="Email Address"
          placeholder="name@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          inputRef={emailRef}
          returnKeyType="next"
          onSubmitEditing={focusMonthlyIncome}
          required
        />
        <ControlledInput
          control={control}
          name="monthlyIncome"
          label="Monthly Income"
          placeholder="40000"
          keyboardType="number-pad"
          leftAccessory={<AppText weight="medium">{'₹'}</AppText>}
          inputRef={monthlyIncomeRef}
          returnKeyType="done"
          required
        />
        <Controller
          control={control}
          name="consent"
          render={({ field: { value, onChange }, fieldState: { error: fieldError } }) => (
            <View style={styles.consentContainer}>
              <Checkbox checked={!!value} onChange={onChange} style={styles.checkbox}>
                <AppText variant="caption" style={styles.consentText}>
                  {t('I agree to the')}{' '}
                  <AppText
                    variant="caption"
                    weight="semiBold"
                    style={styles.link}
                    onPress={() => router.push('/terms')}
                  >
                    Terms of Service
                  </AppText>{' '}
                  {t('of Zapcash.')}
                </AppText>
              </Checkbox>
              {fieldError ? (
                <AppText variant="captionSmall" color="error" style={styles.consentError}>
                  {fieldError.message}
                </AppText>
              ) : null}
            </View>
          )}
        />
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    marginVertical: spacing.lg,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  formContainer: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  phoneLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  checkbox: {
    backgroundColor: 'transparent',
  },
  consentText: {
    color: colors.text.primary,
  },
  link: {
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
  consentError: {
    marginTop: spacing.xs,
    marginLeft: spacing['2xl'],
  },
  consentContainer: {
    justifyContent: 'center',
  },
  successContent: {
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  successContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success.bg,
  },
  successTitle: {
    marginTop: spacing.sm,
  },
  successMessage: {
    maxWidth: 320,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  downloadSuccessBox: {
    width: '100%',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success.light,
    borderRadius: 8,
    backgroundColor: colors.success['bg-2'],
  },
});
