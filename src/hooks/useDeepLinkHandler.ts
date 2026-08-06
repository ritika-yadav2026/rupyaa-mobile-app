import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import {
  parse as parseLinking,
  addEventListener as addEventListenerLinking,
} from 'expo-linking';
import { extractDeepLinkPath, mapNativeRoute } from '@/src/utils/route-map';
import { resolveInitialRoute, type AppRoute } from '@/src/services/navigation';
import { consoleLogDev } from '../utils/common-helper';

/**
 * Handles deep links when app is already running (foreground or resumed from background).
 * Cold-start deep links are handled by resolveInitialNavigation in the index screen.
 */
export function useDeepLinkHandler(): void {
  const pathname = usePathname();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      consoleLogDev('[DeepLink] Warm-start URL received:', url);

      // Reuse the same gate logic as cold-start so we never "fight"
      // with resolveInitialNavigation about where the user should be.
      const resolvedRoute = await resolveInitialRoute();
      const gateRoutes: AppRoute[] = [
        '/onboarding',
        '/auth/mobile-verification',
        '/permissions',
      ];

      if (gateRoutes.includes(resolvedRoute)) {
        consoleLogDev('[DeepLink] Gate route from resolveInitialRoute, ignoring deep link:', resolvedRoute);
        router.replace(resolvedRoute as Parameters<typeof router.replace>[0]);
        return;
      }

      const parsed = parseLinking(url);
      const path = extractDeepLinkPath(parsed);
      const mapped = mapNativeRoute(path);
      const route = mapped.startsWith('/') ? mapped : `/${mapped}`;

      // Avoid redundant navigation (and visual blink) if we're already
      // on the exact same route the deep link resolves to.
      if (pathname === route) {
        consoleLogDev('[DeepLink] Already on target route, skipping navigation:', route);
        return;
      }

      consoleLogDev('[DeepLink] Parsed:', {
        hostname: parsed.hostname,
        path: parsed.path,
        extractedPath: path,
        mapped,
        route,
        currentPathname: pathname,
      });
      router.push(route as Parameters<typeof router.push>[0]);
    };

    const subscription = addEventListenerLinking('url', ({ url }) => {
      handleUrl(url);
    });

    consoleLogDev('[DeepLink] Warm-start listener registered');
    return () => subscription.remove();
  }, []);
}