import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, ScrollView, Linking, AppState, Platform, PermissionsAndroid, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import {
  PermissionCard,
  Screen,
  Button,
  AppText,
  Checkbox,
  SettingsPromptModal,
  RupyaaLogo,
} from '@/src/components';
import { useAppConfigStore } from '@/src/store/useAppConfigStore';
import { colors, radius, spacing, typography } from '@/src/theme';
import { APP_ICON } from '@/src/constants/data';
import { requestUserPermission } from '@/src/utils/firebase-messaging-helper';
import { triggerCredeauSyncAfterSmsPermissionGranted } from '@/src/services/credeau/credeau-sync-service';
import {
  areRequiredAppPermissionsGranted,
  checkAllPermissionStatuses,
  getAvailablePermissions,
  getMissingRequiredPermissions,
  getPermissionIcon,
} from '@/src/services/permissions';
import { getDeviceContactsPermission } from '@/src/services/contacts';
import { getHasGrantedPermissions } from '@/src/services/navigation/routeResolver';
import { useUserDetailsStore } from '@/src/store';
import { useExternalAppConfig } from '@/src/hooks/useExternalAppConfig';
import type { PermissionStatus, PermissionType } from '@/src/types/permissions';
import {
  buildSettingsPromptMessage,
  mapMissingTypesToSettingsPromptDetails,
} from '@/src/utils/permissionSettingsPrompt';
import { tokenStorage } from '@/src/services/auth/tokenStorage';
import { useAuthStore } from '@/src/store/useAuthStore';
import { getAccessToken } from '@/src/services/api/apiHelpers';
import { consoleLogDev } from '@/src/utils/common-helper';

/** Matches `resolveInitialRoute` when there is no access token. */
const AUTH_ROUTE = '/auth/mobile-verification' as const;

type ExitGateReason = 'init' | 'app_active';

async function resolveSessionForPermissionsExit(): Promise<{
  hasSession: boolean;
  tokenSource: 'memory' | 'storage' | 'both' | 'none';
  authStoreStatus: 'idle' | 'ready';
}> {
  const auth = useAuthStore.getState();
  const memory = (await getAccessToken())?.trim() ?? '';
  const storage = (await tokenStorage.getAccessToken())?.trim() ?? '';
  const hasMem = memory.length > 0;
  const hasStorage = storage.length > 0;
  let tokenSource: 'memory' | 'storage' | 'both' | 'none' = 'none';
  if (hasMem && hasStorage) tokenSource = 'both';
  else if (hasMem) tokenSource = 'memory';
  else if (hasStorage) tokenSource = 'storage';
  return {
    hasSession: hasMem || hasStorage,
    tokenSource,
    authStoreStatus: auth.status,
  };
}

export default function PermissionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  // Subscribe to app config so permission list updates when /external/app-config is loaded
  const appConfigFromStore = useAppConfigStore((s) => s.config);
  const appConfigStatus = useAppConfigStore((s) => s.status);
  const { fetchAppConfig } = useExternalAppConfig();

  const { isAuthenticated } = useAuthStore()

  // Wait for app-config to finish loading before computing permission list.
  // This prevents the race condition where getByPassSmsPermission() reads
  // null config and returns wrong defaults on first render.
  const isAppConfigReady = appConfigStatus === 'ready' || appConfigStatus === 'error';

  // Recompute when app-config loads so byPassSmsPermission is respected.
  const PERMISSIONS = useMemo(
    () => (isAppConfigReady ? getAvailablePermissions() : []),
    [appConfigFromStore, isAppConfigReady]
  );
  const PERMISSION_TYPES = useMemo(
    () => PERMISSIONS.map((p) => p.id),
    [PERMISSIONS]
  );
  const hasSmsPermission = useMemo(
    () => PERMISSION_TYPES.includes('sms'),
    [PERMISSION_TYPES]
  );
  const hasContactsPermission = useMemo(
    () => PERMISSION_TYPES.includes('contacts'),
    [PERMISSION_TYPES]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const [showPermissionStatus, setShowPermissionStatus] = useState(false);
  const [permissionStatuses, setPermissionStatuses] =
    useState<Partial<Record<PermissionType, PermissionStatus>>>({});
  const [statusesChecked, setStatusesChecked] = useState(false);
  const personalDetails = useUserDetailsStore(state => state.personalDetails);
  // Used only when the user explicitly taps “Open Settings” — never after “Don’t allow”.
  const hasOpenedSettingsRef = useRef(false);
  /** Prevents duplicate save/navigate when multiple paths call `handlePermissionGranted` (e.g. resume + settings return). */
  const permissionExitToHomeStartedRef = useRef(false);
  const [showSettingsPromptModal, setShowSettingsPromptModal] = useState(false);
  const [settingsPromptDetailItems, setSettingsPromptDetailItems] = useState<
    { title: string; description: string }[]
  >([]);
  const [settingsPromptMessage, setSettingsPromptMessage] = useState(
    'This feature requires permissions to work properly. You can continue after enabling access from your device Settings.',
  );

  // Only show permissions that are not yet granted. For first-time users
  // (statuses not yet checked), show all permissions.
  const visiblePermissions = useMemo(() => {
    if (!statusesChecked) return PERMISSIONS;
    return PERMISSIONS.filter((p) => permissionStatuses[p.id] !== 'granted');
  }, [PERMISSIONS, permissionStatuses, statusesChecked]);

  const refreshPermissionStatuses = useCallback(async () => {
    try {
      const statuses = await checkAllPermissionStatuses(PERMISSION_TYPES);
      setPermissionStatuses(statuses);
      setStatusesChecked(true);
    } catch (e) {
      consoleLogDev('[PermissionsScreen] refreshPermissionStatuses failed — falling back to denied', e);
      const fallbackStatuses: Partial<Record<PermissionType, PermissionStatus>> = {};
      PERMISSION_TYPES.forEach((permissionType) => {
        fallbackStatuses[permissionType] = 'denied';
      });
      setPermissionStatuses(fallbackStatuses);
      setStatusesChecked(true);
    }
  }, [PERMISSION_TYPES]);

  const handlePermissionGranted = useCallback(async (): Promise<void> => {    
    if (permissionExitToHomeStartedRef.current) {
      consoleLogDev('[PermissionsScreen] handlePermissionGranted skipped (exit already in progress)');
      return;
    }
    consoleLogDev('[PermissionsScreen] handlePermissionGranted → saving + home');
    permissionExitToHomeStartedRef.current = true;

    // Start Credeau sync in the background after permissions are granted.
    // Prevents a situation where OTP login runs sync before SMS permission
    // is granted, and we never retry until next app launch.
    void triggerCredeauSyncAfterSmsPermissionGranted();

    const session = await resolveSessionForPermissionsExit();
    if (!session.hasSession) {
      router.replace(AUTH_ROUTE);
      return;
    }

    router.replace('/(tabs)/home');
  }, [router]);

  /**
   * After OS permission check: go home if session + requirements met; send to auth if requirements met but no session; else stay.
   * Uses both Zustand + AsyncStorage for session — memory-only was missing tokens before hydrate / after certain flows.
   */
  const runPermissionsExitGate = useCallback(
    async (reason: ExitGateReason) => {
      const session = await resolveSessionForPermissionsExit();
      const granted = await areRequiredAppPermissionsGranted();
      const missing = granted ? [] : await getMissingRequiredPermissions();
      /** User finished this screen before (Continue + saveCredeauPermissionGranted). Without this, OS-prefilled grants look "done" and we skip to auth before privacy/CTA. */
      const completedPermissionsCheckpoint = await getHasGrantedPermissions();

      consoleLogDev('[PermissionsScreen] exit gate', {
        reason,
        hasSession: session.hasSession,
        tokenSource: session.tokenSource,
        authStoreStatus: session.authStoreStatus,
        requiredPermissionsSatisfied: granted,
        missingRequired: missing,
        completedPermissionsCheckpoint,
      });

      if (permissionExitToHomeStartedRef.current) {
        consoleLogDev('[PermissionsScreen] exit gate skipped (navigation already started)');
        return;
      }

      // Do not auto-leave until the user has completed Continue at least once (storage flag).
      // Otherwise pre-granted camera/location triggers auth/home while dialogs are still in flight.
      if (!completedPermissionsCheckpoint) {
        consoleLogDev('[PermissionsScreen] exit gate → stay (permissions checkpoint not completed yet)');
        return;
      }

      if (granted && session.hasSession) {
        await handlePermissionGranted();
        return;
      }

      if (granted && !session.hasSession) {
        consoleLogDev('[PermissionsScreen] exit gate → auth (permissions OK, no session)');
        permissionExitToHomeStartedRef.current = true;
        router.replace(AUTH_ROUTE);
        return;
      }

      consoleLogDev('[PermissionsScreen] exit gate → stay on permissions screen', {
        granted,
        hasSession: session.hasSession,
      });
    },
    [handlePermissionGranted, router],
  );

  useEffect(() => {
    // Ensure /external/app-config is fetched when this screen mounts after authentication.
    // This is important on hard reloads that land directly on the permissions route, where
    // higher-level layouts may not have triggered app-config loading yet.
    // Only fetch if idle or previously errored; skip if already loading or ready.
    if (appConfigStatus === 'idle' || appConfigStatus === 'error') {
      void fetchAppConfig();
    }
  }, []);

  // Check statuses once app-config is ready and we know which permissions to check.
  useEffect(() => {
    if (!isAppConfigReady || PERMISSION_TYPES.length === 0) return;

    const initialize = async () => {
      consoleLogDev('[PermissionsScreen] initialize', {
        isAppConfigReady,
        permissionTypeCount: PERMISSION_TYPES.length,
      });
      const hasGrantedPermissions = await getHasGrantedPermissions();
      if (hasGrantedPermissions) {
        setShowPermissionStatus(true);
      }
      await refreshPermissionStatuses();
      await runPermissionsExitGate('init');
    };

    void initialize();
  }, [isAppConfigReady, refreshPermissionStatuses, runPermissionsExitGate, PERMISSION_TYPES.length]);

  useEffect(() => {
    if (!isAppConfigReady) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void (async () => {
          await refreshPermissionStatuses();
          await runPermissionsExitGate('app_active');
        })();
      }
    });

    return () => subscription.remove();
  }, [isAppConfigReady, refreshPermissionStatuses, runPermissionsExitGate]);

  const showPermissionsSettingsPrompt = useCallback(
    async (options?: { refreshFirst?: boolean }) => {
      const refreshFirst = options?.refreshFirst !== false;
      if (refreshFirst) {
        await refreshPermissionStatuses();
      }
      const missing = await getMissingRequiredPermissions();
      setSettingsPromptDetailItems(mapMissingTypesToSettingsPromptDetails(missing, PERMISSIONS));
      setSettingsPromptMessage(buildSettingsPromptMessage(missing, PERMISSIONS));
      setShowPermissionStatus(true);
      setShowSettingsPromptModal(true);
    },
    [PERMISSIONS, refreshPermissionStatuses],
  );

  const proceedAfterSettings = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await refreshPermissionStatuses();
      const granted = await areRequiredAppPermissionsGranted();
      if (granted) {
        await handlePermissionGranted();
      } else {
        // User already saw the modal and chose "Open Settings" / adjusted toggles — do not
        // reopen SettingsPromptModal on every return to the app (regardless of outcome).
        setShowPermissionStatus(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [handlePermissionGranted, refreshPermissionStatuses]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && hasOpenedSettingsRef.current) {
        hasOpenedSettingsRef.current = false;
        void proceedAfterSettings();
      }
    });
    return () => subscription.remove();
  }, [proceedAfterSettings]);

  const handleAllowPermission = async () => {
    setIsLoading(true);
    try {
      // Only call system request() when the OS can still show a prompt. After “Don’t allow”
      // (canAskAgain false), calling request again just re-enters the permission flow without a dialog — avoid that loop.
      const existingCamera = await Camera.getCameraPermissionsAsync();
      const cameraResult = existingCamera.granted
        ? existingCamera
        : existingCamera.canAskAgain === false
          ? existingCamera
          : await Camera.requestCameraPermissionsAsync();

      const existingLocation = await Location.getForegroundPermissionsAsync();
      const locationResult = existingLocation.granted
        ? existingLocation
        : existingLocation.canAskAgain === false
          ? existingLocation
          : await Location.requestForegroundPermissionsAsync();

      // READ_SMS is Android-only; the Credeau SDK uses it for financial data analysis.
      // On iOS this permission doesn't exist, so we default to granted.
      let smsGranted = true;
      if (Platform.OS === 'android' && hasSmsPermission) {
        const smsResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
        );
        smsGranted = smsResult === PermissionsAndroid.RESULTS.GRANTED;
      }

      // READ_PHONE_STATE is Android-only; used for SIM status, network info, and fraud detection.
      let phoneStateGranted = true;
      if (Platform.OS === 'android') {
        const phoneStateResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        );
        phoneStateGranted = phoneStateResult === PermissionsAndroid.RESULTS.GRANTED;
      }

      // Notifications should not block onboarding; request them best-effort.
      try {
        await requestUserPermission();
      } catch {
        // Do not block the user if the permission request fails unexpectedly.
      }

      if (hasContactsPermission) {
        try {
          await getDeviceContactsPermission();
        } catch {
          // Optional — denial must not block camera/location/SMS flow.
        }
      }

      const allGranted =
        cameraResult.granted &&
        locationResult.granted &&
        smsGranted &&
        phoneStateGranted;

      if (allGranted) {
        await handlePermissionGranted();
        return;
      }

      await showPermissionsSettingsPrompt();
    } catch {
      await showPermissionsSettingsPrompt();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostContinueClick =  () => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.replace(AUTH_ROUTE);
    }
  }

  const handleOpenSettings = async () => {
    setShowSettingsPromptModal(false);
    hasOpenedSettingsRef.current = true;
    handlePostContinueClick()
    await Linking.openSettings();
  };

  const handleDismissSettingsPrompt = () => {
    setShowSettingsPromptModal(false);
    handlePostContinueClick()
  };

  return (
    <>
      <SettingsPromptModal
        visible={showSettingsPromptModal}
        title="Permission Required"
        message={settingsPromptMessage}
        detailItems={settingsPromptDetailItems}
        footnote="You can tap Continue again later to retry the permission prompts if the system allows it."
        onCancel={handleDismissSettingsPrompt}
        onOpenSettings={() => void handleOpenSettings()}
        cancelLabel="Not now"
        openSettingsLabel="Open Settings"
      />

      <Screen scroll={false}>
        {/* <SafeAreaView style={styles.container} edges={['top', 'bottom']}> */}
        <RupyaaLogo size="xs" style={styles.logo} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppText
            style={styles.title}
            variant="bodyLarge"
            weight="semiBold"
            color="textprimary"
          >
            Permissions Required
          </AppText>

          <View style={styles.infoBanner}>
            <AppText
              style={styles.infoBannerText}
              variant="caption"
              weight="regular"
              color="textprimary"
            >
              {t('To provide you with a')}{' '}
              <AppText variant="caption" weight="semiBold" color="primary">
                seamless experience
              </AppText>{' '}
              {t('during the loan journey and')}{' '}
              <AppText variant="caption" weight="semiBold" color="primary">
                faster disbursals
              </AppText>
              {t(', we require the following permissions.')}
            </AppText>
          </View>

          <View style={styles.permissionsContainer}>
            {!isAppConfigReady ? (
              <ActivityIndicator size="large" color={colors.primary.main} style={styles.configLoader} />
            ) : (
              visiblePermissions.map((permission) => (
                <PermissionCard
                  key={permission.id}
                  icon={getPermissionIcon(permission.id, APP_ICON.SIZE)}
                  title={permission.title}
                  description={permission.description}
                  status={
                    showPermissionStatus
                      ? permissionStatuses[permission.id] ?? 'checking'
                      : undefined
                  }
                />
              ))
            )}
          </View>


        </ScrollView>

        {/* <StickyFooter> */}
        {<View style={styles.footer}>
          <View style={styles.privacyContainer}>
            <Checkbox
              checked={hasAcceptedPrivacy}
              onChange={setHasAcceptedPrivacy}
              fillLabel
              size={18}
            >
              <AppText
                style={styles.privacyText}
                variant="captionSmall"
                weight="regular"
                color="textprimary"
              >
                {t('By continuing, I accept the')}{' '}
                <AppText
                  variant="captionSmall"
                  style={styles.privacyLink}
                  onPress={() => router.push('/privacy')}
                >
                  Privacy Policy
                </AppText>{' '}
                {t('of Rupyaa.')}
              </AppText>
            </Checkbox>
          </View>
          <Button
            variant="primary"
            size="large"
            fullWidth
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
            loading={isLoading}
            disabled={isLoading || !hasAcceptedPrivacy || !isAppConfigReady}
            onPress={handleAllowPermission}
          >
            Continue
          </Button>
        </View>}
        {/* </StickyFooter> */}

        {/* </SafeAreaView> */}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  scrollView: {
    flex: 1,
  },
  logo: {
    marginTop: spacing['3xl'],
    marginHorizontal: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
  },
  title: {
    // fontSize: typography.fontSize['3xl'],
    // fontWeight: typography.fontWeight.bold as any,
    // color: colors.text.primary,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    // fontFamily: typography.fontFamily.bold,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  subtitle: {
    // fontSize: typography.fontSize.base,
    // color: colors.text.secondary,
    // lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.xl,
    // fontFamily: typography.fontFamily.regular,
  },
  missingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily.regular,
  },
  permissionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  configLoader: {
    paddingVertical: spacing.xl,
  },
  infoBanner: {
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  infoBannerText: {
    // Text styling is handled via AppText variants; keep style minimal here.
  },
  privacyContainer: {
    // marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  privacyText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xxs * typography.lineHeight.normal,
  },
  privacyLink: {
    textDecorationLine: 'underline',
    fontSize: typography.fontSize.xxs,
    lineHeight: typography.fontSize.xxs * typography.lineHeight.normal,
  },
  continueButton: {
    height: 38,
    borderRadius: radius.md,
    paddingVertical: 0,
  },
  continueButtonText: {
    fontSize: typography.fontSize.xxs,
  },
});
