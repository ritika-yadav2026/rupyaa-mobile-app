import {
  DEFAULT_DEEP_LINK_FALLBACK_ROUTE,
  mapNativeRoute,
} from '@/src/utils/route-map';

/**
 * Rewrites incoming OS deep link paths before Expo Router resolves them.
 * Unmapped paths go to home instead of +not-found.
 *
 * On cold start (`initial === true`) we always route through `/` so
 * `app/index.tsx` owns the first navigation decision. Without this guard,
 * a cold-start deep link can mount `(tabs)/_layout` directly, whose auth
 * guard then races `resolveInitialRoute()` and skips onboarding on fresh
 * installs. `resolveInitialNavigation()` re-applies the deep link after
 * onboarding/auth/permissions gates are satisfied.
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  if (initial) {
    return '/';
  }

  try {
    const pathOnly = path.split('?')[0] ?? path;
    const segments = pathOnly.replace(/^\/+/, '').replace(/\/+$/, '');
    const mapped = mapNativeRoute(segments);
    return mapped.startsWith('/') ? mapped : `/${mapped}`;
  } catch {
    return DEFAULT_DEEP_LINK_FALLBACK_ROUTE;
  }
}
