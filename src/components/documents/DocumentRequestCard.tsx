import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CloudUpload, FileText, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { colors, spacing, radius, shadows } from '@/src/theme';
import {
  DocumentRequest,
  DocumentRequestStatus,
} from '@/src/services/user/userService';
import { PdfPasswordModal } from '@/src/components/steps/bank-connect/PdfPasswordModal';
import { useDocumentRequestMutation } from '@/src/hooks/useDocumentRequestMutation';
import { pickMultipleDocumentFiles } from '@/src/utils/documentFilePicker';
import type { DocumentFile } from '@/src/utils/documentFilePicker';
import type { ApiResponse } from '@/src/types/api';
import ErrorContainer from '../ErrorContainer';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { goHomeWithFallback } from '@/src/services/navigation/homeNavigation';

interface DocumentRequestCardProps {
  item: DocumentRequest;
  onUploadSuccess?: () => void;
}

const UPLOADABLE_STATUSES: DocumentRequestStatus[] = ['pending', 'rejected'];

const STATUS_CONFIG: Partial<
  Record<
    DocumentRequestStatus,
    { label: string; bg: string; text: string; icon?: React.ReactNode }
  >
> = {
  pending: {
    label: 'Pending Upload',
    bg: colors.warning.main,
    text: colors.text.inverse,
  },
  uploaded: {
    label: 'Uploaded',
    bg: colors.info.main,
    text: colors.text.inverse,
  },
  approved: {
    label: 'Approved',
    bg: colors.primary.lightest_2,
    text: colors.primary.main,
  },
  rejected: {
    label: 'Rejected',
    bg: colors.error.bg,
    text: colors.error.danger,
  },
  cancelled: {
    label: 'Cancelled',
    bg: colors.background.tertiary,
    text: colors.text.secondary,
  },
  not_interested: {
    label: 'Not Interested',
    bg: colors.background.tertiary,
    text: colors.text.secondary,
  },
  closed: {
    label: 'Closed',
    bg: colors.background.tertiary,
    text: colors.text.secondary,
  },
};

const DEFAULT_STATUS_CFG = {
  label: 'Pending Upload',
  bg: colors.warning.main,
  text: colors.text.inverse,
};

function checkFlag(obj: unknown, ...keys: string[]): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return keys.some((k) => record[k] === true || record[k] === 'true');
}

function isPasswordRequiredOrInvalid(response: ApiResponse<unknown>): boolean {
  if (response?.success === true) return false;
  const err = (response as { error?: Record<string, unknown> })?.error;
  if (!err || typeof err !== 'object') return false;
  const keys = [
    'passwordRequired',
    'password_required',
    'isPasswordRequired',
    'passwordInvalid',
    'password_invalid',
    'isPasswordInvalid',
  ];
  if (checkFlag(err, ...keys)) return true;
  const details = err.details;
  return checkFlag(details, ...keys);
}

function isPasswordInvalid(response: ApiResponse<unknown>): boolean {
  if (response?.success === true) return false;
  const err = (response as { error?: Record<string, unknown> })?.error;
  if (!err || typeof err !== 'object') return false;
  const keys = ['passwordInvalid', 'password_invalid', 'isPasswordInvalid'];
  if (checkFlag(err, ...keys)) return true;
  return checkFlag(err.details, ...keys);
}

export function DocumentRequestCard({
  item,
  onUploadSuccess,
}: DocumentRequestCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const uploadMutation = useDocumentRequestMutation();
  const [selectedFiles, setSelectedFiles] = useState<DocumentFile[]>([]);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [pdfPasswordError, setPdfPasswordError] = useState<string>('');
  const [passwordFileName, setPasswordFileName] = useState<string>('');
  const [passwordFileIndex, setPasswordFileIndex] = useState<number>(0);

  const isUploading = uploadMutation.isPending;

  const statusKey: DocumentRequestStatus =
    item.status in STATUS_CONFIG ? (item.status as DocumentRequestStatus) : 'pending';
  const statusCfg = STATUS_CONFIG[statusKey] ?? DEFAULT_STATUS_CFG;
  const showUploadZone = UPLOADABLE_STATUSES.includes(statusKey);
  const isApproved = statusKey === 'approved';
  const isTerminalNeutral =
    statusKey === 'cancelled' || statusKey === 'closed' || statusKey === 'not_interested';
  const hasDescription = Boolean(item.description?.trim());
  const isRejected = statusKey === 'rejected';

  const performUpload = useCallback(
    async (passwordsToUse?: string[]) => {
      if (selectedFiles.length === 0) return;
      setUploadError(null);
      setPdfPasswordError('');

      const resolvedPasswords =
        passwordsToUse ?? Array.from({ length: selectedFiles.length }, (_, i) => passwords[i] ?? '');

      try {
        const result = await uploadMutation.mutateAsync({
          documentRequest: item,
          files: selectedFiles,
          passwords: resolvedPasswords,
        });

        if (result.success) {
          setSelectedFiles([]);
          setPasswords([]);
          setShowPdfPasswordModal(false);
          onUploadSuccess?.();
          return;
        }

        if (isPasswordRequiredOrInvalid(result)) {
          const err = (result as { error?: Record<string, unknown> })?.error;
          const fileIndex = typeof err?.fileIndex === 'number' ? err.fileIndex : 0;
          const fileName = typeof err?.fileName === 'string' ? err.fileName : '';
          setPasswordFileIndex(fileIndex);
          setPasswordFileName(fileName);
          setPasswords((prev) => {
            const next = [...prev];
            while (next.length < selectedFiles.length) next.push('');
            return next.slice(0, selectedFiles.length);
          });
          setShowPdfPasswordModal(true);
          setPdfPasswordError(
            isPasswordInvalid(result) ? 'Incorrect password. Please try again.' : ''
          );
        } else {
          const msg =
            (result as { error?: { message?: string } })?.error?.message ??
            'Upload failed. Please try again.';
          setUploadError(msg);
        }
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Upload failed. Please try again.'
        );
      }
    },
    [item, selectedFiles, passwords, onUploadSuccess, uploadMutation]
  );

  const handlePickFiles = useCallback(async () => {
    if (isPickingFile || isUploading) return;
    setUploadError(null);
    setIsPickingFile(true);
    try {
      const files = await pickMultipleDocumentFiles();
      if (files.length > 0) {
        setSelectedFiles((prev) => [...prev, ...files]);
        setPasswords((prev) => [...prev, ...files.map(() => '')]);
      }
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : 'Unable to select file. Please try again.'
      );
    } finally {
      setIsPickingFile(false);
    }
  }, [isPickingFile, isUploading]);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPasswords((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  }, []);

  const handleUploadPress = useCallback(() => {
    void performUpload();
  }, [performUpload]);

  const handlePdfPasswordSubmit = useCallback(
    (password: string) => {
      const trimmed = password.trim();
      const nextPasswords = Array.from(
        { length: selectedFiles.length },
        (_, i) => (i === passwordFileIndex ? trimmed : passwords[i] ?? '')
      );
      setPasswords(nextPasswords);
      void performUpload(nextPasswords);
    },
    [performUpload, passwordFileIndex, passwords, selectedFiles.length]
  );

  const handleClosePdfPasswordModal = useCallback(() => {
    setShowPdfPasswordModal(false);
    setPdfPasswordError('');
  }, []);

  const handleContinuePress = useCallback(() => {
    goHomeWithFallback(router);
  }, [router]);

  const canUpload = selectedFiles.length > 0 && !isUploading;

  return (
    <>
      <View
        style={styles.card}
        accessibilityRole="none"
        accessibilityLabel={`Document request: ${item.documentName}, status: ${statusCfg.label}`}
      >
        {/* Header: document name, description below, status badge right */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <AppText
              variant="caption"
              weight="semiBold"
              color="textprimary"
              style={styles.documentName}
            >
              {item.documentName}
            </AppText>

            {hasDescription && (
              <AppText
                variant="captionSmall"
                color="tertiary"
                style={styles.description}
              >
                {item.description}
              </AppText>
            )}
          </View>
        </View>

        {isRejected && item.rejectionCount > 0 && (
          <View style={styles.rejectionNote}>
            <AppText variant="captionSmall" weight="semiBold" style={styles.rejectionText}>
              {/* Rejected {item.rejectionCount} time{item.rejectionCount > 1 ? 's' : ''}. Please
              re-upload. */}
              {item?.rejectionReason}
            </AppText>
          </View>
        )}

        {/* Approved: success banner */}
        {isApproved && (
          <>
            <View style={styles.approvedBanner}>
              <View style={{ marginTop: spacing.xs }}>
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  color={colors.primary.main}
                  style={{
                    marginTop: spacing.xs,
                  }}
                />
              </View>
              <View style={styles.approvedTextWrap}>
                <AppText variant="caption" weight="semiBold" style={styles.approvedTitle}>
                  Documents Approved
                </AppText>
                <AppText variant="captionSmall" style={styles.approvedSubtext}>
                  Your documents have been approved successfully.
                </AppText>
              </View>
            </View>
            <View style={styles.approvedCtaWrap}>
              <Button variant="primary" size="small" fullWidth onPress={handleContinuePress}>
                Continue
              </Button>
            </View>
          </>
        )}

        {/* Cancelled / Closed / Not interested: neutral banner */}
        {isTerminalNeutral && (
          <View style={styles.neutralBanner}>
            <AppText variant="captionSmall" color="tertiary">
              {t('This request is {{status}}.', { status: statusCfg.label.toLowerCase() })}
            </AppText>
          </View>
        )}

        {!isApproved && <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
          <AppText
            variant="captionSmall"
            weight="semiBold"
            style={{ color: statusCfg.text }}
          >
            {statusCfg.label.toUpperCase()}
          </AppText>
        </View>}

        {/* Upload zone + button for pending / uploaded / rejected */}
        {showUploadZone && (
          <View style={styles.uploadSection}>
            {selectedFiles.length === 0 ? (
              <TouchableOpacity
                style={styles.uploadZone}
                onPress={handlePickFiles}
                activeOpacity={0.7}
                disabled={isPickingFile || isUploading}
                accessibilityLabel="Select documents to upload"
                accessibilityRole="button"
              >
                <CloudUpload size={28} color={colors.text.tertiary} />
                <AppText
                  variant="caption"
                  weight="semiBold"
                  style={styles.uploadCta}
                  color="textprimary"
                >
                  {isPickingFile ? 'Opening file picker...' : 'Click to select documents'}
                </AppText>
                <AppText variant="captionSmall" color="tertiary" style={styles.uploadHint}>
                  or drag and drop files here
                </AppText>
                <AppText variant="captionSmall" color="tertiary" style={styles.uploadFormats}>
                  Supported formats: PDF, JPG, PNG. Max 10MB per file.
                </AppText>
              </TouchableOpacity>
            ) : (
              <View style={styles.selectedFileContainer}>
                {selectedFiles.map((file, index) => (
                  <View key={`${file.uri}-${index}`} style={styles.selectedFileRow}>
                    <FileText size={22} color={colors.primary.main} />
                    <View style={styles.selectedFileInfo}>
                      <AppText variant="body" weight="medium" numberOfLines={1}>
                        {file.name}
                      </AppText>
                      <AppText variant="captionSmall" style={styles.fileSelectedLabel}>
                        Selected
                      </AppText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveFile(index)}
                      hitSlop={12}
                      disabled={isUploading}
                      accessibilityLabel="Remove file"
                      accessibilityRole="button"
                    >
                      <X size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <Button
                  variant="outline"
                  size="small"
                  fullWidth
                  onPress={handlePickFiles}
                  disabled={isPickingFile || isUploading}
                >
                  Add More Files
                </Button>
              </View>
            )}

            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleUploadPress}
              loading={isUploading}
              disabled={!canUpload}
              leftIcon={
                !isUploading ? (
                  <CloudUpload size={18} color={colors.primary.contrast} />
                ) : undefined
              }
            >
              Upload Documents
            </Button>

            {uploadError ? (
              <ErrorContainer responseError={uploadError} />
            ) : null}
          </View>
        )}

        {/* Footer: requested date left, doc count right */}
        <View style={styles.footerRow}>
          <AppText variant="captionSmall" color="tertiary">
            {t('Requested {{date}}', { date: formatDate(item.date) })}
          </AppText>
          <AppText variant="captionSmall" color="tertiary">
            {(item.documents?.length ?? 0)}{' '}
            {t((item.documents?.length ?? 0) === 1 ? 'doc' : 'documents')} {t('uploaded')}
          </AppText>
        </View>
      </View>

      <PdfPasswordModal
        visible={showPdfPasswordModal}
        onClose={handleClosePdfPasswordModal}
        onSubmit={handlePdfPasswordSubmit}
        loading={isUploading}
        errorMessage={uploadError ?? pdfPasswordError}
        fileName={passwordFileName || undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  documentName: {
    marginBottom: spacing.xs / 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    flexShrink: 0,
    marginVertical: spacing.md,
  },
  badgeIcon: {
    marginRight: spacing.xs,
  },
  description: {
    lineHeight: 18,
  },
  rejectionNote: {
    backgroundColor: colors.error.bg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  rejectionText: {
    color: colors.error.danger,
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary.lightest_2,
    borderRadius: radius.md,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  approvedTextWrap: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  approvedTitle: {
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  approvedSubtext: {
    color: colors.primary.main,
  },
  approvedCtaWrap: {
    marginTop: spacing.base,
  },
  neutralBanner: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  uploadSection: {
    marginTop: spacing.md,
    rowGap: spacing.base,
  },
  uploadZone: {
    borderWidth: 1,
    borderColor: colors.info.light,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    // backgroundColor: colors.info.bg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCta: {
    marginTop: spacing.sm,
  },
  uploadHint: {
    marginTop: spacing.xs,
  },
  uploadFormats: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  selectedFileContainer: {
    rowGap: spacing.sm,
  },
  selectedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
  },
  selectedFileInfo: {
    flex: 1,
    marginLeft: spacing.base,
    minWidth: 0,
  },
  fileSelectedLabel: {
    color: colors.success.main,
    marginTop: spacing.xs,
  },
  inlineError: {
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
