import { API_ENDPOINTS, BANK_STATEMENT_UPLOAD_TIMEOUT_MS } from '@/src/config/api';
import { apiClient } from '@/src/services/api/apiClient';
import type { ApiResponse } from '@/src/types/api';
import type {
  ApplyLoanResponse,
  GetUserBankStatementStatusResult,
  GetUserStageResult,
  UserEligibilityExperianResponse,
  UserStageSectionsCompleted,
  UserStageContext,
} from '@/src/types/user';
import type { GetContactDetailsResponse, VerifyOfficeEmailRequest, SendEmailOtpRequest, VerifyEmailOtpRequest } from '@/src/types/kyc';
import type { UserStage } from '@/src/config/userStages';
import { USER_STAGES, UserStagesInBackend } from '@/src/config/userStages';
import { getPersonalDetails } from '@/src/services/registration/registrationApi';
import type { GetPersonalDetailsResponse } from '@/src/types/registration';
import { useUserDetailsStore } from '@/src/store/useUserDetailsStore';
import { createAsyncCache } from '@/src/utils/async-cache';
import {
  getUserSaveAppInfoPayload,
  type UserSaveAppInfoPayload,
} from '@/src/hooks/useUserSaveAppInfoPayload';
import { consoleLogDev, getApiErrorDisplayMessage } from '@/src/utils/common-helper';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const collectNestedRecords = (record: Record<string, unknown>) => {
  const keys = ['data', 'result', 'user', 'stage'];
  const nested: Record<string, unknown>[] = [];
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) nested.push(value);
  }
  return nested;
};

const pickString = (records: Array<Record<string, unknown> | undefined>, keys: string[]) => {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return undefined;
};

const pickBoolean = (records: Array<Record<string, unknown> | undefined>, keys: string[]) => {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') return value;
    }
  }
  return undefined;
};

const pickRecord = (records: Array<Record<string, unknown> | undefined>, key: string) => {
  for (const record of records) {
    if (!record) continue;
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return undefined;
};

function isValidUserStage(value: unknown): value is UserStage {
  return typeof value === 'string' && USER_STAGES.includes(value as UserStage);
}

const KYC_STAGES: readonly UserStage[] = [
  UserStagesInBackend.CONTACT_DETAILS,
  UserStagesInBackend.ADDRESS_DETAILS,
  UserStagesInBackend.FAMILY_REFERENCE,
  UserStagesInBackend.BANK_DETAILS,
  UserStagesInBackend.AADHAAR_KYC,
  UserStagesInBackend.FACE_KYC,
];

type KycSectionRule = {
  key: keyof UserStageSectionsCompleted;
  stage: UserStage;
  fallbackKeys?: Array<keyof UserStageSectionsCompleted>;
};

const LEGACY_FAMILY_REFERENCE_KEY: keyof UserStageSectionsCompleted = 'isFamilyReferenceComplete';

const KYC_SECTION_ORDER: KycSectionRule[] = [
  { key: 'isContactComplete', stage: UserStagesInBackend.CONTACT_DETAILS },
  { key: 'isAddressComplete', stage: UserStagesInBackend.ADDRESS_DETAILS },
  {
    key: 'isFamilyComplete',
    stage: UserStagesInBackend.FAMILY_REFERENCE,
    fallbackKeys: [LEGACY_FAMILY_REFERENCE_KEY],
  },
  {
    key: 'isReferenceComplete',
    stage: UserStagesInBackend.FAMILY_REFERENCE,
    fallbackKeys: [LEGACY_FAMILY_REFERENCE_KEY],
  },
  { key: 'isBankComplete', stage: UserStagesInBackend.BANK_DETAILS },
  { key: 'isAadhaarComplete', stage: UserStagesInBackend.AADHAAR_KYC },
  { key: 'isFaceKycComplete', stage: UserStagesInBackend.FACE_KYC },
];

function getSectionBoolean(
  sections: UserStageSectionsCompleted,
  key: keyof UserStageSectionsCompleted,
  fallbackKeys: Array<keyof UserStageSectionsCompleted> = []
): boolean | undefined {
  const value = sections[key];
  if (typeof value === 'boolean') return value;

  for (const fallbackKey of fallbackKeys) {
    const fallback = sections[fallbackKey];
    if (typeof fallback === 'boolean') return fallback;
  }

  return undefined;
}

function isSectionsCompleted(value: unknown): value is UserStageSectionsCompleted {
  if (!isRecord(value)) return false;
  return KYC_SECTION_ORDER.some(({ key, fallbackKeys }) => {
    if (typeof value[key] === 'boolean') return true;
    return (fallbackKeys ?? []).some((fallbackKey) => typeof value[fallbackKey] === 'boolean');
  });
}

function deriveStageFromSectionsCompleted(
  sections: UserStageSectionsCompleted
): UserStage | undefined {
  for (const { key, stage, fallbackKeys } of KYC_SECTION_ORDER) {
    const value = getSectionBoolean(sections, key, fallbackKeys);
    if (value === false) return stage;
    if (value !== true) return undefined;
  }
  return undefined;
}

function isUserStageContext(value: unknown): value is UserStageContext {
  if (!isRecord(value)) return false;

  const offerStatus = value.offerStatus;
  const offerSource = value.offerSource;
  const showUpdateButton = value.showUpdateButton;

  const isOfferStatusValid = offerStatus === undefined || typeof offerStatus === 'string';
  const isOfferSourceValid = offerSource === undefined || typeof offerSource === 'string';
  const isShowUpdateButtonValid =
    showUpdateButton === undefined || typeof showUpdateButton === 'boolean';

  return isOfferStatusValid && isOfferSourceValid && isShowUpdateButtonValid;
}

function normalizeUserStageResponse(data: unknown): GetUserStageResult {
  if (!isRecord(data)) return { raw: data };
  const records = [data, ...collectNestedRecords(data)];
  const stageCandidate = pickString(records, ['stage', 'userStage', 'currentStage', 'status']);
  const showDashboard = pickBoolean(records, ['showDashboard', 'show_dashboard']);
  const retryStage = pickBoolean(records, ['retryStage', 'retry_stage']);
  const sectionsCandidate = pickRecord(records, 'sectionsCompleted');
  const sectionsCompleted = isSectionsCompleted(sectionsCandidate) ? sectionsCandidate : undefined;
  const contextCandidate = pickRecord(records, 'context');
  const context = isUserStageContext(contextCandidate) ? contextCandidate : undefined;

  let stage: UserStage | undefined = undefined;
  if (stageCandidate && isValidUserStage(stageCandidate)) {
    stage = stageCandidate;
  }

  const derivedStage = sectionsCompleted
    ? deriveStageFromSectionsCompleted(sectionsCompleted)
    : undefined;

  if (derivedStage && (stage == null || KYC_STAGES.includes(stage))) {
    stage = derivedStage;
  }

  if (stage) {
    return { stage, sectionsCompleted, showDashboard, context, retryStage, raw: data };
  }
  return { sectionsCompleted, showDashboard, context, retryStage, raw: data };
}

export type GetTempUrlResponse = {
  success?: boolean;
  message?: string;
  tempUrl?: string;
  url?: string;
  expiresIn?: number;
};

export type UploadBankStatementFile = {
  uri: string;
  name: string;
  type?: string;
};

export type UploadBankStatementRequest = {
  file: UploadBankStatementFile;
  confidentialCode: string;
};

export type UploadBankStatementResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

export type DocumentRequestAdmin = {
  _id: string;
  username: string;
  adminRole: string;
};

export type DocumentRequestStatus =
  | 'pending'
  | 'uploaded'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'not_interested'
  | 'closed';

export type DocumentRequest = {
  _id: string;
  loanId: string;
  userId: string;
  adminId?: DocumentRequestAdmin;
  documentName: string;
  description?: string;
  status: DocumentRequestStatus;
  rejectionCount: number;
  date: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
};

export type GetDocumentRequestsResponse = {
  message?: string;
  data?: DocumentRequest[];
};

export type DocumentFile = {
  uri: string;
  name: string;
  mimeType: string;
};

/** Single document entry in upload API success response. */
export type UploadedDocumentEntry = {
  _id: string;
  originalName?: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  password?: string;
};

/** Success response body from POST /document-requests/upload/:id */
export type UploadDocumentRequestResponse = {
  message: string;
  data: Omit<DocumentRequest, 'documents' | 'userId'> & {
    userId: string | { _id: string };
    documents: UploadedDocumentEntry[];
  };
};

let saveUserAppInfoInFlight: Promise<ApiResponse<unknown>> | null = null;

export const userService = {
  getUserStage: async (): Promise<ApiResponse<GetUserStageResult>> => {
    const response = await apiClient.get<unknown>(API_ENDPOINTS.user.getUserStage);
    if (!response.success) return response as ApiResponse<GetUserStageResult>;
    return { ...response, data: normalizeUserStageResponse(response.data) };
  },
  getUserBankStatementStatus: async (): Promise<ApiResponse<GetUserBankStatementStatusResult>> => {
    const response = await apiClient.get<GetUserBankStatementStatusResult>(
      API_ENDPOINTS.user.getUserBankStatementStatus
    );
    if (response.success || response.status !== 404) return response;

    return apiClient.get<GetUserBankStatementStatusResult>(
      API_ENDPOINTS.user.getUserBankStatementStatus
    );
  },
  getUserEligibilityExperian: async (): Promise<ApiResponse<UserEligibilityExperianResponse>> => {
    return apiClient.get<UserEligibilityExperianResponse>(API_ENDPOINTS.user.getUserEligibilityExperian);
  },
  getContactDetails: async (): Promise<ApiResponse<GetContactDetailsResponse>> => {
    return apiClient.get<GetContactDetailsResponse>(API_ENDPOINTS.user.getContactDetails);
  },
  verifyOfficeEmail: async (
    data: VerifyOfficeEmailRequest
  ): Promise<ApiResponse<unknown>> => {
    return apiClient.post(API_ENDPOINTS.user.verifyOfficeEmail, data);
  },
  verifyPersonalEmail: async (
    data: VerifyOfficeEmailRequest
  ): Promise<ApiResponse<unknown>> => {
    return apiClient.post(API_ENDPOINTS.user.verifyPersonalEmail, data);
  },
  sendEmailOtp: async (
    data: SendEmailOtpRequest
  ): Promise<ApiResponse<unknown>> => {
    const result = await apiClient.post(API_ENDPOINTS.external.emailVerify, data);
    // Return result so caller can use getApiErrorDisplayMessage(result.error) for user-friendly text
    return result;
  },
  verifyEmailOtp: async (
    data: VerifyEmailOtpRequest
  ): Promise<ApiResponse<unknown>> => {
    return apiClient.post(API_ENDPOINTS.external.emailCheckOtp, data);
  },
  getTempUrl: async (payload: { phoneNumber: string }): Promise<ApiResponse<GetTempUrlResponse>> => {
    const result = await apiClient.post<GetTempUrlResponse>(API_ENDPOINTS.user.getTempUrl, payload);
    if (!result.success) {
      const display =
        getApiErrorDisplayMessage(result.error) ||
        result.error?.message ||
        'Failed to get temp URL';
      throw new Error(display);
    }
    return result;
  },
  uploadBankStatement: async (
    payload: UploadBankStatementRequest
  ): Promise<ApiResponse<UploadBankStatementResponse>> => {
    const formData = new FormData();
    formData.append(
      'file',
      {
        uri: payload.file.uri,
        name: payload.file.name,
        type: payload.file.type ?? 'application/pdf',
      } as unknown as Blob
    );

    if (payload.confidentialCode.trim().length > 0) {
      formData.append('confidentialCode', payload.confidentialCode);
    }

    const result = await apiClient.put<UploadBankStatementResponse>(
      API_ENDPOINTS.user.uploadBankStatement,
      formData,
      { timeoutMs: BANK_STATEMENT_UPLOAD_TIMEOUT_MS }
    );
    if (__DEV__) {
      console.log('[userService.uploadBankStatement] result', result);
    }
    // Do not throw here; controller handles success/error using ApiResponse.
    return result;
  },
  applyLoan: async (): Promise<ApiResponse<ApplyLoanResponse>> => {
    return apiClient.post<ApplyLoanResponse>(API_ENDPOINTS.loans.applyLoan);
  },
  saveAppInfo: async (
    payload: UserSaveAppInfoPayload
  ): Promise<ApiResponse<unknown>> => {
    return apiClient.post<unknown>(API_ENDPOINTS.user.saveAppInfo, payload);
  },

};

const personalDetailsCache = createAsyncCache<GetPersonalDetailsResponse | undefined>({
  shouldCache: (details) => details !== undefined,
});

async function fetchUserPersonalDetailsFromApiAndStore(): Promise<GetPersonalDetailsResponse | undefined> {
  const store = useUserDetailsStore.getState();
  store.setLoading(true);

  try {
    const response = await getPersonalDetails();

    if (!response.success) {
      return undefined;
    }

    const details = response.data;
    store.setPersonalDetails(details);

    return details;
  } catch (error) {
    return undefined;
  } finally {
    store.setLoading(false);
  }
}

/**
 * Fetches personal details from backend and stores them in the user details store.
 * Returns the personal details if successful, undefined otherwise.
 * Never throws - handles all errors gracefully.
 */
export async function fetchAndStoreUserPersonalDetails(options?: {
  forceRefresh?: boolean;
}): Promise<GetPersonalDetailsResponse | undefined> {
  const store = useUserDetailsStore.getState();

  if (!options?.forceRefresh) {
    const cached = personalDetailsCache.getCached() ?? store.personalDetails ?? undefined;
    if (cached) {
      if (!personalDetailsCache.getCached()) {
        personalDetailsCache.set(cached);
      }
      if (!store.personalDetails) {
        store.setPersonalDetails(cached);
      }
      return cached;
    }
  }

  return personalDetailsCache.getOrFetch(fetchUserPersonalDetailsFromApiAndStore, {
    forceRefresh: options?.forceRefresh,
  });
}

export async function fetchTempUrlFromApiAndStore(payload: {
  phoneNumber: string;
}): Promise<GetTempUrlResponse | undefined> {
  const store = useUserDetailsStore.getState();
  store.setLoading(true);

  try {
    const result = await userService.getTempUrl(payload);
    // getTempUrl throws on failure; keep a guard so `result.data` is typed (narrows ApiResponse).
    if (!result.success) {
      const display =
        getApiErrorDisplayMessage(result.error) ||
        result.error?.message ||
        'Failed to get temp URL';
      throw new Error(display);
    }
    const responseData = result.data;
    const resolvedTempUrl = responseData?.tempUrl || responseData?.url;
    if (!resolvedTempUrl) {
      throw new Error(responseData?.message ?? 'Temporary URL not found in response');
    }
    return {
      ...responseData,
      tempUrl: resolvedTempUrl,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to get temp URL',
    };
  } finally {
    store.setLoading(false);
  }
}

/**
 * Clears the in-memory personal details cache.
 * Call this on logout so the next session always fetches fresh data.
 */
export function clearPersonalDetailsCache(): void {
  personalDetailsCache.clear();
}

export async function saveUserAppInfoForCurrentSession(): Promise<ApiResponse<unknown>> {
  if (saveUserAppInfoInFlight) {
    return saveUserAppInfoInFlight;
  }

  saveUserAppInfoInFlight = (async () => {
    try {
      const payload = await getUserSaveAppInfoPayload();
      consoleLogDev('userService.saveUserAppInfoForCurrentSession', payload);
      return await userService.saveAppInfo(payload);
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to prepare app info payload',
          code: 'SAVE_APP_INFO_PAYLOAD_FAILED',
        },
      };
    } finally {
      saveUserAppInfoInFlight = null;
    }
  })();

  return saveUserAppInfoInFlight;
}
