import React from 'react';
import {
  BankConnectFetchingContent,
  BankConnectManualUploadContent,
  BankConnectMobileContent,
  BankStatementPendingContent,
  type ActionCardConfig,
} from './BankConnectContent';
import { BankStatementUploader } from './BankStatementUploader';
import type { BankConnectResolvedView } from './useBankConnectStepController';
import type { BankConnectChecklistItem } from './bankConnectContinueMessages';

const MANUAL_UPLOAD_ERROR = '';

type BankConnectStepContentProps = {
  resolvedView: BankConnectResolvedView;
  mobile: string;
  onChangeMobile: (value: string) => void;
  fetchErrorMessage: string;
  uploadProgress: number;
  uploadedFileName: string | null;
  selectedStatementFileName: string | null;
  onPickStatementFile: () => void;
  onRemoveFile: () => void;
  onUploadPress: () => void;
  isPickingStatementFile: boolean;
  isUploading: boolean;
  isPolling: boolean;
  statusMessage: string;
  bankConnectChecklistItems: BankConnectChecklistItem[];
  pollingTimedOut?: boolean;
  /** Optional action card for mobile view (e.g. Get a Higher Loan Amount) */
  actionCard?: ActionCardConfig;
  secondaryActionCard?: ActionCardConfig;
  /** Optional primary CTA shown below safety points in mobile view. */
  mobilePrimaryCta?: React.ReactNode;
  /** Optional action card for bank-statement-pending view (e.g. Upload Manually when attempts are low). */
  pendingActionCard?: ActionCardConfig;
  /** Optional info note for bank-statement-pending view. */
  pendingInfoNote?: string;
};

export function BankConnectStepContent({
  resolvedView,
  mobile,
  onChangeMobile,
  fetchErrorMessage,
  uploadProgress,
  uploadedFileName,
  selectedStatementFileName,
  onPickStatementFile,
  onRemoveFile,
  onUploadPress,
  isPickingStatementFile,
  isUploading,
  isPolling,
  statusMessage,
  bankConnectChecklistItems,
  pollingTimedOut = false,
  actionCard,
  secondaryActionCard,
  mobilePrimaryCta,
  pendingActionCard,
  pendingInfoNote,
}: BankConnectStepContentProps): React.JSX.Element {
  switch (resolvedView) {
    case 'mobile':
      return (
        <BankConnectMobileContent
          mobile={mobile}
          onChangeMobile={onChangeMobile}
          errorMessage={fetchErrorMessage}
          primaryCta={mobilePrimaryCta}
          actionCard={actionCard}
          secondaryActionCard={secondaryActionCard}
        />
      );

    // case 'fetching':
    //   return <BankConnectFetchingContent />;

    case 'upload-idle':
      return (
        <BankConnectManualUploadContent
          variant="idle"
          errorMessage={fetchErrorMessage || MANUAL_UPLOAD_ERROR}
          uploadProgress={uploadProgress}
          uploadedFileName={uploadedFileName}
          uploader={
            <BankStatementUploader
              selectedFileName={selectedStatementFileName}
              onPickFile={onPickStatementFile}
              onRemoveFile={onRemoveFile}
              onUploadPress={onUploadPress}
              isPickingFile={isPickingStatementFile}
              isUploading={isUploading}
            />
          }
          onUploadPress={onUploadPress}
          onRemoveFile={onRemoveFile}
        />
      );

    case 'upload-progress':
      return (
        <BankConnectManualUploadContent
          variant="progress"
          uploadProgress={uploadProgress}
          uploadedFileName={uploadedFileName}
          onUploadPress={onUploadPress}
          onRemoveFile={onRemoveFile}
        />
      );

    case 'upload-success':
      return (
        <BankConnectManualUploadContent
          variant="success"
          uploadProgress={uploadProgress}
          uploadedFileName={uploadedFileName}
          onUploadPress={onUploadPress}
          onRemoveFile={onRemoveFile}
        />
      );

    case 'bank-statement-pending':
      return (
        <BankStatementPendingContent
          isPolling={isPolling}
          message={statusMessage}
          checklistItems={bankConnectChecklistItems}
          showError={pollingTimedOut}
          actionCard={pendingActionCard}
          infoNote={pendingInfoNote}
        />
      );
  }
}
