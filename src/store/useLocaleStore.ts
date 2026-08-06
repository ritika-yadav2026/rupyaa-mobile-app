import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '@/src/services/i18n';
import { resolveDeviceLanguage, type LanguageCode } from '@/src/config/languages';
import { STORAGE_KEYS } from '@/src/constants/data';

interface LocaleState {
  language: LanguageCode;
  isHindi: boolean;
  setLanguage: (language: LanguageCode) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      // Matches the synchronous default i18n.ts resolves at module load, so rehydration
      // (when there's no persisted preference yet) doesn't stomp it back to English.
      language: resolveDeviceLanguage(),
      isHindi: resolveDeviceLanguage() === 'hi',
      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language, isHindi: language === 'hi' });
      },
    }),
    {
      name: STORAGE_KEYS.languagePreference,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
