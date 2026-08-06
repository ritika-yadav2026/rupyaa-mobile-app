import { useEffect } from 'react';
import { useUserDetailsStore } from '@/src/store/useUserDetailsStore';
import { fetchAndStoreUserPersonalDetails } from '@/src/services/user/userService';

/**
 * Provides personal details from the shared Zustand store.
 *
 * Fetching strategy (simple & non-redundant):
 *  - App startup already calls fetchAndStoreUserPersonalDetails() for authenticated users.
 *  - This hook only triggers a fetch when the store is still empty (e.g. the hook
 *    is rendered before startup finishes, or in a fresh session where startup
 *    was skipped because the user wasn't authenticated yet).
 *  - The underlying fetchAndStoreUserPersonalDetails() uses an in-memory cache,
 *    so concurrent or repeated calls without forceRefresh never fire a second request.
 *  - On logout, clearPersonalDetailsCache() + clearPersonalDetails() must be called
 *    so the next session starts fresh.
 */
export function usePersonalDetails() {
  const personalDetails = useUserDetailsStore((s) => s.personalDetails);
  const isFetching = useUserDetailsStore((s) => s.isLoading);

  useEffect(() => {
    if (!personalDetails) {
      void fetchAndStoreUserPersonalDetails();
    }
  // Intentionally depends only on personalDetails presence, not the full object,
  // to avoid re-running after every field update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalDetails == null]);

  return { personalDetails, isFetching };
}
