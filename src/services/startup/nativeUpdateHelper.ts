import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/constants/data';

export const nativeUpdateHelper = {
  setSkippedUpdateVersion: async (currentProductionVersion: string): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.SKIPPED_UPDATE_VERSION, currentProductionVersion);
  },
  getSkippedUpdateVersion: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(STORAGE_KEYS.SKIPPED_UPDATE_VERSION);
  },
};
