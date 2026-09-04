export {
  personalDetailsSchema,
  salariedSchema,
  selfEmployedSchema,
  unemployedSchema,
  employmentDetailsFormSchema,
  personalWithEmploymentSchema,
  type PersonalDetailsSchema,
  type SalariedSchema,
  type SelfEmployedSchema,
  type UnemployedSchema,
  type EmploymentDetailsFormSchema,
  type PersonalWithEmploymentSchema,
} from './schemas';

export {
  RegistrationService,
  type RegistrationStep,
} from './registrationService';

export {
  postPersonalDetails,
  getPersonalDetails,
  postEmploymentType,
  postEmploymentDetails,
  getEmploymentDetails,
  postContactDetails,
  postResidenceAddress,
  postFamilyDetails,
  postReferenceDetails,
  getSalaryAccounts,
  postBankDetails,
  mapPersonalDetailsToApi,
  mapPersonalDetailsFromApi,
  mapEmploymentDefaultsFromPersonalDetailsApi,
  mapEmploymentDetailsFromPersonalDetailsApi,
  mapEmploymentTypeToApi,
  mapEmploymentDetailsToApi,
  mapEmploymentDetailsFromApi,
  REJECTION_ERROR_CODE,
} from './registrationApi';

export {
  REGISTRATION_ERROR_MESSAGES,
  toErrorResponse,
  createRegistrationSubmit,
  type CreateSubmitOptions,
} from './registrationSubmit';

export {
  handleRegistrationStepSuccess,
  type HandleRegistrationStepSuccessParams,
} from './handleStepSuccess';

export {
  executeSoftPullFlow,
} from './softPullFlow';
