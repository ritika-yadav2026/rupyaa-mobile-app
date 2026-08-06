import { getFCMPushToken } from '@/src/utils/firebase-messaging-helper';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useUserDetailsStore } from '@/src/store';
import type { GetPersonalDetailsResponse } from '@/src/types/registration';
import saveTokenToDb from './save-token-to-db';

/**
 * POSTs the FCM token to `/user/set-fcm-token` when session + profile are ready.
 * Pass `personalDetails` from the caller when you already have it (e.g. right after get-personal-details)
 * so sync does not depend on a second Zustand read.
 */
export async function trySyncFcmTokenForAuthenticatedUser(
  personalDetailsOverride?: GetPersonalDetailsResponse | null,
): Promise<void> {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  const personalDetails =
    personalDetailsOverride ?? useUserDetailsStore.getState().personalDetails;
  if (!isAuthenticated || !personalDetails) {
    return;
  }

  const token = await getFCMPushToken();
  if (!token) {
    return;
  }

  await saveTokenToDb(token, isAuthenticated, personalDetails);
}
