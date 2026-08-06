import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/constants/data';
import { useFlowStore } from '@/src/store/useFlowStore';
import type {
  PersonalDetails,
  EmploymentType,
  EmploymentDetails,
  RegistrationData,
} from '@/src/types/registration';

export type RegistrationStep =
  | 'personal_details'
  | 'employment_type'
  | 'employment_details'
  | 'completed';

export const RegistrationService = {
  /**
   * @deprecated Flow state is now managed by useFlowStore (Zustand).
   * Kept only for migration: syncRegistrationToFlowStore reads this for users with existing data.
   */
  async getCurrentStep(): Promise<RegistrationStep> {
    const localStep = await AsyncStorage.getItem(STORAGE_KEYS.registrationStep);
    return (localStep as RegistrationStep) || 'personal_details';
  },

  async savePersonalDetails(data: PersonalDetails): Promise<void> {
    const existing = await this.getRegistrationData();
    const updated: Partial<RegistrationData> = {
      ...existing,
      personalDetails: data,
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.registrationData,
      JSON.stringify(updated)
    );
  },

  async saveEmploymentType(type: EmploymentType): Promise<void> {
    const existing = await this.getRegistrationData();
    const updated: Partial<RegistrationData> = {
      ...existing,
      employmentMode: type,
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.registrationData,
      JSON.stringify(updated)
    );
  },

  async saveEmploymentDetails(data: EmploymentDetails): Promise<void> {
    const existing = await this.getRegistrationData();
    const updated: Partial<RegistrationData> = {
      ...existing,
      employmentDetails: data,
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.registrationData,
      JSON.stringify(updated)
    );
  },

  async getRegistrationData(): Promise<Partial<RegistrationData> | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.registrationData);
    return data ? JSON.parse(data) : null;
  },

  async clearRegistration(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.registrationStep,
      STORAGE_KEYS.registrationData,
    ]);
    // Reset timeline state to ensure consistency with cleared form data
    useFlowStore.getState().reset();
  },
};
