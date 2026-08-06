/**
 * Types for KYC flow: Contact Details and Address Details.
 */

/** Form shape for Contact Details step */
export interface ContactDetails {
  email: string;
  alternate_mobile: string;
  officeEmail?: string;
}

/** Request body for POST /user/post-contact-details */
export interface PostContactDetailsRequest {
  email: string;
  alternate_mobile?: string;
  officeEmail?: string;
}

/** Option flags for a contact field (personalEmail, officeEmail, alternateMobile) */
export interface ContactFieldOption {
  show: boolean;
  verify?: boolean;
  required?: boolean;
}

/** Backend-driven options per field. personalEmail = email for FE. */
export interface ContactFieldOptions {
  personalEmail?: ContactFieldOption;
  officeEmail?: ContactFieldOption;
  alternateMobile?: ContactFieldOption;
}

/** Inner contact details from GET /user/get-contact-details */
export interface ContactDetailsData {
  email?: string;
  alternate_mobile?: string;
  officeEmail?: string;
}

/** Full response shape for GET /user/get-contact-details */
export interface GetContactDetailsResponse {
  message?: string;
  contactDetails?: ContactDetailsData;
  contactFieldOptions?: ContactFieldOptions;
}

/** Request body for POST /user/verify-office-email */
export interface VerifyOfficeEmailRequest {
  email: string;
  phoneNumber: string;
}

/** Request body for POST /email-verify (OTP generation) */
export interface SendEmailOtpRequest {
  email: string;
  isPersonalMail: boolean;
}

/** Request body for POST /external/email-check-otp (OTP verification) */
export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
  isPersonalMail: boolean;
}

/** Form shape for Address Details step */
export interface AddressDetails {
  addressLine1: string;
  addressLine2: string;
  pinCode: string;
  city: string;
  state: string;
}

/** Request body for POST /user/post-residence-address */
export interface PostResidenceAddressRequest {
  addressLine1: string;
  addressLine2: string;
  pinCode: string;
  city: string;
  state: string;
}

/** Allowed relationship values for family/reference dropdowns */
export const RELATIONSHIP_VALUES = [
  'Parent',
  'Spouse',
  'Sibling',
  'Child',
  'Guardian',
  'Other',
] as const;

export type RelationshipValue = (typeof RELATIONSHIP_VALUES)[number];

/** Family member shape for POST /user/post-family-details */
export interface FamilyMember {
  name: string;
  relation: string;
  mobile: string;
}

/** Form/API shape for family details (single family member) */
export interface FamilyDetails {
  familyMember: FamilyMember;
}

/** Request body for POST /user/post-family-details */
export interface PostFamilyDetailsRequest {
  familyMember: FamilyMember;
}

/** Single reference shape for POST /user/post-reference-details */
export interface ReferenceInfo {
  name: string;
  mobile: string;
  relationship: string;
}

/** Form/API shape for reference details (two references) */
export interface ReferenceDetails {
  reference1: ReferenceInfo;
  reference2: ReferenceInfo;
}

/** Request body for POST /user/post-reference-details */
export interface PostReferenceDetailsRequest {
  reference1: ReferenceInfo;
  reference2: ReferenceInfo;
}

/** Allowed account type values for bank details */
export const BANK_ACCOUNT_TYPE_VALUES = ['Saving', 'Current'] as const;
export type BankAccountType = (typeof BANK_ACCOUNT_TYPE_VALUES)[number];

/** Form shape for Bank Details step */
export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: BankAccountType;
}

/** Response from GET /user/salary-accounts */
export interface SalaryAccountsResponse {
  salaryAccounts: string[];
  hintText?: string;
  validationText?: string;
}

/** Request body for POST /user/post-bank-details */
export interface PostBankDetailsRequest {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: BankAccountType;
}
