import type { ApiResponse } from '@/src/types/api';
import { errorHandler } from '@/src/utils/common-helper';

/**
 * Generalized registration submit pattern.
 *
 * Usage:
 * 1. createRegistrationSubmit() - builds a submit fn with mock/real API + try-catch
 * 2. useRegistrationSubmit() - hook with standardized mutation + error display
 *
 * Example (PersonalDetailsStep):
 *   const submitFn = createRegistrationSubmit({ useMock, mockSave, mapToPayload, apiCall });
 *   const { submit, isPending, errorMessage, clearError } = useRegistrationSubmit({ mutationFn: submitFn, onSuccess });
 */

/** Standard error messages for registration API flows */
export const REGISTRATION_ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  generic: 'Something went wrong. Please try again.',
} as const;

/** Convert any error to ApiError shape; never throws */
export function toErrorResponse(error: unknown): ApiResponse<never> {
  return {
    success: false,
    error: { message: errorHandler(error) },
  };
}

const SUCCESS_RESPONSE: ApiResponse<unknown> = { success: true, data: {} };

export type CreateSubmitOptions<TInput, TPayload> = {
  useMock: boolean;
  mockSave: (data: TInput) => Promise<void>;
  mapToPayload: (data: TInput) => TPayload;
  apiCall: (payload: TPayload) => Promise<ApiResponse<unknown>>;
};

/**
 * Create a standardized submit function for registration steps.
 * Handles mock vs real API, mapping, and try-catch; never throws.
 */
export function createRegistrationSubmit<TInput, TPayload>(
  options: CreateSubmitOptions<TInput, TPayload>
): (data: TInput) => Promise<ApiResponse<unknown>> {
  return async (data: TInput) => {
    if (options.useMock) {
      try {
        await options.mockSave(data);
        return SUCCESS_RESPONSE;
      } catch (error) {
        return toErrorResponse(error);
      }
    }
    try {
      const payload = options.mapToPayload(data);
      return options.apiCall(payload);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
