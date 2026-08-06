import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '@/src/config/api';
import type { LoanOffer } from '@/src/data/offer';
import { MOCK_LOAN_OFFER } from '@/src/data/offer';
import { apiClient } from '@/src/services/api/apiClient';
import type { ApiResponse } from '@/src/types/api';
import type { CurrentOfferResponse } from '@/src/types/offer';

const STORAGE_KEY_STATUS = '@fatafat/offer-status';
const STORAGE_KEY_OFFER = '@fatafat/offer-data';
const STORAGE_KEY_ACCEPTED = '@fatafat/offer-accepted';

export type OfferStatus = 'pending' | 'approved';

/** Simulated delay for offer check (ms) */
const REFRESH_DELAY_MS = 1500;

/**
 * Offer service for managing loan offer status and data.
 * Used by ApprovedOfferStep to check status, refresh, and accept offers.
 */
export const offerService = {
  /**
   * Fetch current offer from backend (GET /offer/current-offer).
   * Call when user stage is BANK_STATEMENT.
   * Success with offer: data has offer. Success with no offer: data.message only. 404: success false.
   */
  async getCurrentOffer(): Promise<ApiResponse<CurrentOfferResponse>> {
    return apiClient.get<CurrentOfferResponse>(API_ENDPOINTS.offer.currentOffer);
  },

  /**
   * Check current offer status from storage.
   */
  async checkOfferStatus(): Promise<OfferStatus | null> {
    try {
      const accepted = await AsyncStorage.getItem(STORAGE_KEY_ACCEPTED);
      if (accepted === 'true') return null;

      const status = await AsyncStorage.getItem(STORAGE_KEY_STATUS);
      if (status === 'pending' || status === 'approved') return status;
      return 'pending';
    } catch {
      return 'pending';
    }
  },

  /**
   * Fetch approved offer data from storage.
   */
  async fetchApprovedOffer(): Promise<LoanOffer | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_OFFER);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LoanOffer;
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Simulate offer refresh (API call). After bank connect, returns approved with mock data.
   */
  async refreshOffer(): Promise<OfferStatus> {
    await new Promise((resolve) => setTimeout(resolve, REFRESH_DELAY_MS));

    try {
      // Mock: approve and store offer
      await AsyncStorage.setItem(STORAGE_KEY_STATUS, 'approved');
      await AsyncStorage.setItem(STORAGE_KEY_OFFER, JSON.stringify(MOCK_LOAN_OFFER));
      return 'approved';
    } catch (error) {
      console.error('Failed to refresh offer:', error);
      return 'pending';
    }
  },

  /**
   * Accept current offer (POST /offer/accept-offer). No request body.
   * Returns API response; call when user taps Accept on ApprovedOfferStep.
   */
  async acceptOfferApi(): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>(API_ENDPOINTS.offer.acceptOffer);
  },

  /**
   * Mark offer as accepted in local storage (legacy). Prefer acceptOfferApi for real flow.
   */
  async acceptOffer(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ACCEPTED, 'true');
    } catch (error) {
      console.error('Failed to accept offer:', error);
    }
  },

  /**
   * Reset offer state (for dev/testing).
   */
  async reset(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY_STATUS,
        STORAGE_KEY_OFFER,
        STORAGE_KEY_ACCEPTED,
      ]);
    } catch (error) {
      console.error('Failed to reset offer:', error);
    }
  },
};
