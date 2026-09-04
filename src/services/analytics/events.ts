/**
 * Firebase Analytics event names: snake_case, max 40 characters, no reserved names.
 * Grouped by funnel section for easier GTM mapping.
 */
export const ANALYTICS_EVENT = {
  BUREAU_POLICY_RESPONSE_APP: 'bureau_policy_response_app',

  // Auth
  GET_OTP_BUTTON: 'get_otp_button',
  VERIFY_OTP_CLICK: 'verify_otp_click',
  OTP_SUCCESS_SCREEN: 'otp_success_screen',

  // Register (loan wizard)
  PERSONAL_EMPLOYMENT_DETAIL_PAGE_LAND: 'personal_employment_detail_page_land',
  PERSONAL_EMPLOYMENT_DETAIL_PAGE_SUBMIT: 'personal_employment_detail_page_submit',
  PERSONAL_DETAIL_PAGE_LAND: 'personal_detail_page_land',
  PERSONAL_DETAIL_PAGE_SUBMIT: 'personal_detail_page_submit',
  EMPLOYMENT_DETAIL_PAGE_LAND: 'employment_detail_page_land',
  EMPLOYMENT_DETAIL_PAGE_SUBMIT: 'employment_detail_page_submit',
  ORGANISATION_DETAIL_PAGE_LAND: 'organisation_detail_page_land',
  ORGANISATION_DETAIL_PAGE_SUBMIT: 'organisation_detail_page_submit',

  // Offer
  REVIEW_OFFER_PAGE_LAND: 'review_offer_page_land',
  REVIEW_OFFER_PAGE_CLICK: 'review_offer_page_click',

  // KYC
  CONTACT_DETAIL_PAGE_LAND: 'contact_detail_page_land',
  CONTACT_DETAIL_PAGE_SUBMIT: 'contact_detail_page_submit',
  ADDRESS_PAGE_LAND: 'address_page_land',
  ADDRESS_PAGE_SUBMIT: 'address_page_submit',
  FAMILY_DETAIL_PAGE_LAND: 'family_detail_page_land',
  FAMILY_DETAIL_PAGE_SUBMIT: 'family_detail_page_submit',
  REFERENCE_PAGE_LAND: 'reference_page_land',
  REFERENCE_PAGE_SUBMIT: 'reference_page_submit',
  BANK_DETAIL_PAGE_LAND: 'bank_detail_page_land',
  BANK_DETAIL_PAGE_SUBMIT: 'bank_detail_page_submit',
  DIGILOCKER_INITIAL_CLICK: 'digilocker_initial_click',

  // Disbursal
  ENACH_PAGE_LAND: 'enach_page_land',
  /** Fires when user starts Cashfree mandate registration (after intro screen). */
  EMANDATE_REGISTRATION_PAGE_LAND: 'emandate_registration_page',
  ESIGN_INITIATED_CLICK: 'esign_initiated_click',
  DISBURSEMENT_PAGE_LAND: 'disbursement_page_land',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];
