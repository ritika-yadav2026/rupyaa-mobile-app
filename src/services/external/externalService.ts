import type { ApiResponse } from '@/src/types/api';

import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '@/src/config/api';

/**
 * Response type for HyperKYC access token endpoint
 */
export type HyperKycAccessTokenResponse = {
  success: boolean;
  token: string;
};

/**
 * Response type for Aadhaar image endpoint
 */
export type AdhaarImageResponse = {
  success: boolean;
  imageLink: string;
};

/**
 * Response type for HyperKYC result sync endpoint
 */
export type HyperKycApiResultsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    applicationStatus?: string;
    workflowDetails?: {
      workflowId?: string;
      version?: number;
    };
    results?: Record<string, unknown>[];
    userDetails?: Record<string, unknown>;
  };
};

/**
 * Response type for loan id endpoint
 */
export type LoanIdResponse = {
  success?: boolean;
  loanId?: string;
};

/**
 * External service for third-party integrations
 */
export const externalService = {
  /**
   * Fetches HyperKYC access token for face verification
   * @returns Promise with access token response
   */
  getHyperKycAccessToken: async (): Promise<ApiResponse<HyperKycAccessTokenResponse>> => {
    const response = await apiClient.get<HyperKycAccessTokenResponse>(
      API_ENDPOINTS.external.getHyperKycAccessToken
    );
    return response;
    // return {
    //   success: true,
    //   data: {
    //     success: true,
    //     token: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6Ino2MTN3cSIsImhhc2giOiJiNDdlZjY3Yjg1ZDQ5N2EwN2VkYzVjYTBkZTIxZWJjNWZmMjI0OGU0ZGZhMGUyZGVkOTcwMzk1MzZmNDg1ZmM3IiwiaWF0IjoxNzcwODMwMzU5LCJleHAiOjE3NzA4MzA4NTksImp0aSI6IjQ4NzhkOWI4LTFlOTEtNGFlMS1iM2UwLTExM2IxZGE4M2QzOCJ9.CZIeILCcZYj23cX3RtGyUHVKPrqNZa2r9ufoPh9fpAMVxAfIYTeZCEIJ_nVgwo4RFxa8iXz7x9Yy87odWffLmzM9iYlTc7cjrhQweip2E2crCloaNmqYASwh-3b5u8bZo9hlR-qzL74IT_LukNT7gLMKgsJMsjmXeG5m8yD-5Dc"
    //   }
    // }
  },
  /**
   * Fetches Aadhaar image link for face verification
   * @returns Promise with Aadhaar image response
   */
  getAdhaarImage: async (): Promise<ApiResponse<AdhaarImageResponse>> => {
    const response = await apiClient.get<AdhaarImageResponse>(
      API_ENDPOINTS.external.getAdhaarImage
    );
    return response;
  },
  /**
   * Fetches HyperKYC workflow result and stores it on backend.
   * @returns Promise with HyperKYC result sync response
   */
  getHyperKycApiResults: async (): Promise<ApiResponse<HyperKycApiResultsResponse>> => {
    const response = await apiClient.get<HyperKycApiResultsResponse>(
      API_ENDPOINTS.external.getHyperKycApiResults
    );
    return response;
  },
  /**
   * Fetches backend loan id to use as HyperKYC transaction id.
   * @returns Promise with loan id response
   */
  getLoanId: async (): Promise<ApiResponse<LoanIdResponse>> => {
    const response = await apiClient.get<LoanIdResponse>(
      API_ENDPOINTS.loans.getLoanId
    );
    return response;
  },
};
