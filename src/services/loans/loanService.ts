import { API_ENDPOINTS } from '@/src/config/api';
import { apiClient } from '@/src/services/api/apiClient';
import type { ApiResponse } from '@/src/types/api';

/**
 * Loan service for managing user loans.
 */
export const loanService = {
  /**
   * Fetch all user loans (GET /loans/get-all-user-loans).
   * Returns list of all loans associated with the current user.
   */
  async getAllUserLoans(): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>(API_ENDPOINTS.loans.getAllUserLoans);
  },

  /**
   * Fetch existing active loan (GET /loans/get-existing-active-loan).
   * Returns the user's active loan if one exists.
   */
  async getExistingActiveLoan(): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>(API_ENDPOINTS.loans.getExistingActiveLoan);
  },
};
