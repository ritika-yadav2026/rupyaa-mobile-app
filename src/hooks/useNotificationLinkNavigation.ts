import { useEffect, useRef } from 'react';
import { RelativePathString, usePathname, useRouter, useSegments } from 'expo-router';
import { consoleLogDev } from '../utils/common-helper';

interface UseNotificationLinkNavigationReturn {
  navigateToNotificationLink(link: string): void;
}

const ensureLeadingSlash = (value: string): string => {
  if (!value) {
    return '/';
  }
  return value.startsWith('/') ? value : `/${value}`;
};

const collapseSlashes = (value: string): string => {
  return value.replace(/\/{2,}/g, '/');
};

const removeScheme = (value: string): string => {
  return value.replace(/^[^:]+:\/\//, '');
};

const removeExpoDoubleDashPrefix = (value: string): string => {
  return value.replace(/^\/--/, '/');
};

const logNotificationNavigationDebug = (event: string, context: Record<string, unknown> = {}): void => {
  consoleLogDev(`[NotificationNavigation] ${event}`, context);
};

const splitPathSegments = (path: string): readonly string[] => {
  return path.split('/').filter(Boolean);
};

const isDynamicSegment = (segment?: string): boolean => {
  if (!segment) {
    return false;
  }
  return segment.startsWith('[') && segment.endsWith(']');
};

const normalizeNotificationLink = (rawLink: string): string | null => {
  if (!rawLink) {
    return null;
  }
  const trimmedLink = rawLink.trim();
  if (!trimmedLink) {
    return null;
  }
  try {
    const absoluteUrl = new URL(trimmedLink);
    const normalizedAbsolutePath = removeExpoDoubleDashPrefix(
      collapseSlashes(ensureLeadingSlash(absoluteUrl.pathname))
    );
    if (!normalizedAbsolutePath || normalizedAbsolutePath === '/') {
      return null;
    }
    return `${normalizedAbsolutePath}${absoluteUrl.search}`;
  } catch {
    const queryIndex = trimmedLink.indexOf('?');
    const queryString = queryIndex >= 0 ? trimmedLink.slice(queryIndex) : '';
    const baseLink = queryIndex >= 0 ? trimmedLink.slice(0, queryIndex) : trimmedLink;
    const withoutScheme = removeScheme(baseLink);
    if (!withoutScheme) {
      return null;
    }
    let pathCandidate = withoutScheme;
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex >= 0) {
      const potentialDomain = withoutScheme.slice(0, slashIndex);
      if (potentialDomain.includes('.') || potentialDomain.includes(':')) {
        pathCandidate = withoutScheme.slice(slashIndex);
      }
    } else if (withoutScheme.includes('.')) {
      return null;
    }
    const normalizedPath = removeExpoDoubleDashPrefix(
      collapseSlashes(ensureLeadingSlash(pathCandidate))
    );
    if (!normalizedPath || normalizedPath === '/') {
      return null;
    }
    return `${normalizedPath}${queryString}`;
  }
};

/**
 * Exposes the canonical navigation helper for notification deep links.
 * The helper prevents back navigation breakage by:
 * - Normalising incoming URLs (stripping host/scheme, collapsing slashes, removing Expo prefixes).
 * - Skipping navigation when already on the target screen or when the link was handled last.
 * - Replacing the root screen when launched cold / without history, so the stack remains consistent.
 */
export function useNotificationLinkNavigation(): UseNotificationLinkNavigationReturn {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const segmentsRef = useRef<string[]>(segments);
  const pathnameRef = useRef<string>(pathname);
  const lastNavigatedPathRef = useRef<string | null>(null);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    pathnameRef.current = pathname;
    if (lastNavigatedPathRef.current && lastNavigatedPathRef.current !== pathname) {
      lastNavigatedPathRef.current = null;
    }
  }, [pathname]);

  /**
   * Drives navigation for a notification deep link while keeping the back stack stable.
   */
  const navigateToNotificationLink = (link: string): void => {
    const normalizedLink = normalizeNotificationLink(link);
    logNotificationNavigationDebug('navigateToNotificationLink invoked', { link, normalizedLink, currentPath: pathnameRef.current });
    if (!normalizedLink) {
      logNotificationNavigationDebug('navigateToNotificationLink skipped invalid normalizedLink', { link });
      return;
    }
    if (pathnameRef.current === normalizedLink) {
      lastNavigatedPathRef.current = normalizedLink;
      logNotificationNavigationDebug('navigateToNotificationLink already on target', { normalizedLink });
      return;
    }
    if (lastNavigatedPathRef.current === normalizedLink) {
      logNotificationNavigationDebug('navigateToNotificationLink deduped last navigation', { normalizedLink });
      return;
    }
    const currentSegments: readonly string[] = segmentsRef.current;
    const targetSegments: readonly string[] = splitPathSegments(
      normalizedLink.split('?')[0] ?? normalizedLink
    );
    const rootSegment: string | undefined = currentSegments[0];
    const nextSegment: string | undefined = currentSegments[1];
    const targetRootSegment: string | undefined = targetSegments[0];
    const canGoBack: boolean = router.canGoBack();
    const shouldReplace = !canGoBack
      || rootSegment === '(tabs)'
      || (rootSegment === targetRootSegment && isDynamicSegment(nextSegment));
    // Replace when we have no existing history, when we resume inside the tabs root, or when the stack already contains the target route.
    if (shouldReplace) {
      logNotificationNavigationDebug('navigateToNotificationLink executing replace', {
        normalizedLink,
        currentSegments,
        targetSegments,
        canGoBack,
        rootSegment,
        nextSegment,
        targetRootSegment,
      });
      router.replace(normalizedLink as RelativePathString);
    } else {
      logNotificationNavigationDebug('navigateToNotificationLink executing push', {
        normalizedLink,
        currentSegments,
        targetSegments,
        canGoBack,
        rootSegment,
        nextSegment,
        targetRootSegment,
      });
      router.push(normalizedLink as RelativePathString);
    }
    lastNavigatedPathRef.current = normalizedLink;
  };

  return { navigateToNotificationLink };
}

