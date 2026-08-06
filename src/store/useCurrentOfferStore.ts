import { create } from 'zustand';
import type { ApiResponse } from '@/src/types/api';
import type { CurrentOfferResponse } from '@/src/types/offer';

export interface CurrentOfferState {
  /** Last response from GET /offer/current-offer (set when user stage is BANK_STATEMENT). */
  lastResponse: ApiResponse<CurrentOfferResponse> | null;
  /**
   * UI-ready value derived atomically from lastResponse.
   * Components must read this instead of user-stage context or a copied local value.
   */
  showUpdateButton: boolean;
  setLastResponse: (response: ApiResponse<CurrentOfferResponse> | null) => void;
  clear: () => void;
}

export function getShowUpdateButton(response: ApiResponse<CurrentOfferResponse> | null): boolean {
  if (!response?.success || response.data == null || !('offer' in response.data)) return false;
  return response.data.showUpdateButton === true;
}

export const useCurrentOfferStore = create<CurrentOfferState>((set) => ({
  lastResponse: null,
  showUpdateButton: false,
  // Update the response and its UI flag in one Zustand transaction so the card
  // can never render from a different /offer/current snapshot than the offer.
  setLastResponse: (response) =>
    set({
      lastResponse: response,
      showUpdateButton: getShowUpdateButton(response),
    }),
  clear: () => set({ lastResponse: null, showUpdateButton: false }),
}));
