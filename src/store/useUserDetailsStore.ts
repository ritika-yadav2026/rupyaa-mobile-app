import { create } from 'zustand';
import type { GetPersonalDetailsResponse } from '@/src/types/registration';

export interface UserDetailsState {
  personalDetails: GetPersonalDetailsResponse | null;
  isLoading: boolean;
  setPersonalDetails: (details: GetPersonalDetailsResponse | null) => void;
  setLoading: (loading: boolean) => void;
  clearPersonalDetails: () => void;
}

export const useUserDetailsStore = create<UserDetailsState>((set) => ({
  personalDetails: null,
  isLoading: false,
  setPersonalDetails: (details) => {
    set({ personalDetails: details });
  },
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  clearPersonalDetails: () => {
    set({ personalDetails: null });
  },
}));
