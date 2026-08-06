import type { FlowSubstepId } from '@/src/config/flowSteps';

import { ANALYTICS_EVENT } from './events';
import type { AnalyticsEventName } from './events';

/**
 * Land events for loan wizard substeps (spreadsheet "Land"/"Fire" rows).
 * Excludes: soft-pull, bank-connect, digilocker (click-only), face-kyc, esign (click-only).
 */
export const LOAN_JOURNEY_LAND_EVENT_BY_SUBSTEP: Partial<
  Record<FlowSubstepId, AnalyticsEventName>
> = {
  'personal-details': ANALYTICS_EVENT.PERSONAL_DETAIL_PAGE_LAND,
  'employment-type': ANALYTICS_EVENT.EMPLOYMENT_DETAIL_PAGE_LAND,
  'employment-details': ANALYTICS_EVENT.ORGANISATION_DETAIL_PAGE_LAND,
  'approved-offer': ANALYTICS_EVENT.REVIEW_OFFER_PAGE_LAND,
  'contact-details': ANALYTICS_EVENT.CONTACT_DETAIL_PAGE_LAND,
  'address-details': ANALYTICS_EVENT.ADDRESS_PAGE_LAND,
  'family-details': ANALYTICS_EVENT.FAMILY_DETAIL_PAGE_LAND,
  'reference-details': ANALYTICS_EVENT.REFERENCE_PAGE_LAND,
  'bank-details': ANALYTICS_EVENT.BANK_DETAIL_PAGE_LAND,
  enach: ANALYTICS_EVENT.ENACH_PAGE_LAND,
  sanctioned: ANALYTICS_EVENT.DISBURSEMENT_PAGE_LAND,
};
