import { useAuthStore } from '@/src/store/useAuthStore';
import { tokenStorage } from './tokenStorage';

/** Returns a non-empty access token from memory or storage, or null when logged out. */
export async function getValidAccessToken(): Promise<string | null> {
  const [storageToken, memoryToken] = await Promise.all([
    tokenStorage.getAccessToken(),
    Promise.resolve(useAuthStore.getState().accessToken),
  ]);
  const token = (memoryToken ?? storageToken)?.trim() ?? '';
  return token.length > 0 ? token : null;
}

export async function hasValidSession(): Promise<boolean> {
  return (await getValidAccessToken()) !== null;
}
