import type { DropdownOption } from '@/src/components/DropdownSelect';

/** Stable values for support issue dropdown (no API contract yet). */
export const SUPPORT_ISSUE_VALUES = [
  'Application Status',
  'Loan Offer Issue',
  'Personal Details Correction',
  'Document Upload or Verification Issue',
  'Aadhaar or PAN Verification Issue',
  'Selfie Verification Issue',
  'Bank Statement Issue',
  'Bank Account Issue',
  'Auto Payment Setup Issue',
  'Loan Agreement Signing Issue',
  'App or Technical Issue',
  'Other Query',
] as const;

export type SupportIssueValue = (typeof SUPPORT_ISSUE_VALUES)[number];

export const SUPPORT_ISSUE_OPTIONS: DropdownOption<SupportIssueValue>[] = [
  { label: 'Application Status', value: 'Application Status' },
  { label: 'Loan Offer Issue', value: 'Loan Offer Issue' },
  { label: 'Personal Details Correction', value: 'Personal Details Correction' },
  { label: 'Document Upload or Verification Issue', value: 'Document Upload or Verification Issue' },
  { label: 'Aadhaar or PAN Verification Issue', value: 'Aadhaar or PAN Verification Issue' },
  { label: 'Selfie Verification Issue', value: 'Selfie Verification Issue' },
  { label: 'Bank Statement Issue', value: 'Bank Statement Issue' },
  { label: 'Bank Account Issue', value: 'Bank Account Issue' },
  { label: 'Auto Payment Setup Issue', value: 'Auto Payment Setup Issue' },
  { label: 'Loan Agreement Signing Issue', value: 'Loan Agreement Signing Issue' },
  { label: 'App or Technical Issue', value: 'App or Technical Issue' },
  { label: 'Other Query', value: 'Other Query' },
];
