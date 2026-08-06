import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@fatafat/access-token';
const REFRESH_TOKEN_KEY = '@fatafat/refresh-token';

export const tokenStorage = {
  getAccessToken: () => AsyncStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => AsyncStorage.setItem(ACCESS_TOKEN_KEY, token),
  clearAccessToken: () => AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => AsyncStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearRefreshToken: () => AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
  clearAll: async () => {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  },
};
