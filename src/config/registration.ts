export const REGISTRATION_STEPS = [
  { id: 'register', label: 'Register' },
  { id: 'approved-offer', label: 'Approved Offer' },
  { id: 'kyc', label: 'KYC' },
  { id: 'disbursal', label: 'Disbursal' },
] as const;

export type RegistrationStepId = (typeof REGISTRATION_STEPS)[number]['id'];
