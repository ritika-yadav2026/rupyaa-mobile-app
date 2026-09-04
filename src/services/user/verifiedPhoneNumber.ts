import { storageService } from '@/src/services/storage/storageService';
import { useUserDetailsStore } from '@/src/store/useUserDetailsStore';

export async function resolveVerifiedPhoneNumber(): Promise<string> {
  const profilePhone = useUserDetailsStore.getState().personalDetails?.phoneNumber?.replace(/\D/g, '');
  if (profilePhone) return profilePhone.slice(-10);
  try {
    const storedPhone = await storageService.getKey('verifiedPhoneNumber');
    return storedPhone?.replace(/\D/g, '').slice(-10) ?? '';
  } catch {
    return '';
  }
}
