import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInitialURL, parse as parseLinking } from 'expo-linking';
import { STORAGE_KEYS } from '@/src/constants/data';
import { hasValidSession } from '@/src/services/auth/session';
import { areRequiredAppPermissionsGranted } from '@/src/services/permissions';
import { fetchAndStoreAppConfig } from '@/src/hooks/useExternalAppConfig';
import { resolveFlowRoute } from './flowRoutes';
import { extractDeepLinkPath, mapNativeRoute } from '@/src/utils/route-map';
import { consoleLogDev } from '@/src/utils/common-helper';
import { appConfig } from '@/src/config/appConfig';

export type AppRoute =
  | '/onboarding-language'
  | '/onboarding'
  | '/auth/mobile-verification'
  | '/permissions'
  | '/loan-journey'
  | '/registration/personal-details'
  | '/registration/email-otp'
  | '/registration/employment-type'
  | '/registration/salaried-details'
  | '/registration/self-employed-details'
  | '/registration/unemployed-details'
  | '/registration/work-email-otp'
  | '/registration/approved-offer'
  | '/kyc/digilocker'
  | '/kyc/face-kyc'
  | '/kyc/email-verify'
  | '/kyc/family-details'
  | '/disbursal/agreement'
  | '/disbursal/esign'
  | '/disbursal/sanctioned'
  | '/(tabs)/home'
  | '/(tabs)/my-loan'
  | '/my-profile'
  | '/support'
  | '/need-help'
  | '/account/faq'
  | '/privacy-policy'
  | '/terms-of-service'
  | '/user-permissions'
  | '/lending-partners'
  | '/payment';

/** Routes that require onboarding/auth/permissions first; deep link is ignored when user hits these. */
const GATE_ROUTES: readonly AppRoute[] = [
  '/onboarding-language',
  '/onboarding',
  '/auth/mobile-verification',
  '/permissions',
];

export async function resolveInitialRoute(): Promise<AppRoute> {
  const [hasSelectedLanguage, hasSeenOnboarding, isPhoneVerified, hasGrantedPermissions] =
  await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.hasSelectedLanguage),
    AsyncStorage.getItem(STORAGE_KEYS.hasSeenOnboarding),
    AsyncStorage.getItem(STORAGE_KEYS.isPhoneVerified),
    AsyncStorage.getItem(STORAGE_KEYS.hasGrantedPermissions),
  ]);
  let hasSession = await hasValidSession();
  consoleLogDev('ResolveInitialRoute', {hasSelectedLanguage, hasSeenOnboarding, isPhoneVerified, hasGrantedPermissions, hasSession});
  if (hasSelectedLanguage !== 'true') return '/onboarding-language';
  if (appConfig.enableOnboarding && hasSeenOnboarding !== 'true') {
    return '/onboarding';
  }
  if (isPhoneVerified !== 'true') return '/auth/mobile-verification';
  // Load external app-config before permission check so flags like
  // byPassSmsPermission are available. Skips if already loaded.
  if (hasSession) {
    await fetchAndStoreAppConfig();
    // App-config fetch may 401 and clear session — re-check before routing to tabs.
    hasSession = await hasValidSession();
  }
  if (hasGrantedPermissions !== 'true') return '/permissions';
  const allGranted = await areRequiredAppPermissionsGranted();
  consoleLogDev('areRequiredAppPermissionsGranted', allGranted);
  if (!hasSession) return '/auth/mobile-verification';
  if (!allGranted) return '/permissions';

  const flowRoute = await resolveFlowRoute();
  if (flowRoute !== '/(tabs)/home') {
    return flowRoute as AppRoute;
  }

  return '/(tabs)/home';
}

/**
 * Resolves the initial route considering both normal startup flow and cold-start deep links.
 * When user opens app via deep link, navigates to the deep link target if they're past onboarding/auth.
 */
export async function resolveInitialNavigation(): Promise<string> {
  const [resolvedRoute, initialUrl] = await Promise.all([
    resolveInitialRoute(),
    getInitialURL(),
  ]);

  consoleLogDev('[DeepLink] Cold-start check:', { resolvedRoute, initialUrl });

  // User must complete onboarding/auth/permissions first; ignore deep link.
  if (GATE_ROUTES.includes(resolvedRoute as (typeof GATE_ROUTES)[number])) {
    consoleLogDev('[DeepLink] Gate route hit, ignoring deep link:', resolvedRoute);
    return resolvedRoute;
  }

  if (initialUrl) {
    const parsed = parseLinking(initialUrl);
    const path = extractDeepLinkPath(parsed);
    const mapped = mapNativeRoute(path);
    const route = mapped.startsWith('/') ? mapped : `/${mapped}`;
    consoleLogDev('[DeepLink] Cold-start navigating:', { hostname: parsed.hostname, path: parsed.path, extractedPath: path, mapped, route });
    return route;
  }

  consoleLogDev('[DeepLink] No initial URL, using resolved route:', resolvedRoute);
  return resolvedRoute;
}

export async function getHasGrantedPermissions(): Promise<boolean> {
  const hasGrantedPermissions = await AsyncStorage.getItem(STORAGE_KEYS.hasGrantedPermissions);
  return hasGrantedPermissions === 'true';
}
