import { Camera } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
// import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';
import { PermissionStatus, PermissionType, PermissionStatusMap } from '@/src/types/permissions';
import { getByPassSmsPermission } from '@/src/config/resolvedAppConfig';
import { requestUserNotificationPermissionStatus } from '@/src/utils/firebase-messaging-helper';
import { consoleLogDev } from '@/src/utils/common-helper';

/**
 * Check camera permission status
 */
async function checkCameraPermission(): Promise<PermissionStatus> {
  try {
    const result = await Camera.getCameraPermissionsAsync();
    return result.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Check location permission status.
 * Android automatically revokes "Only this time" grants when the app
 * process is killed. On the next cold start, getForegroundPermissionsAsync()
 * returns granted: false for those — so checking result.granted is sufficient.
 */
async function checkLocationPermission(): Promise<PermissionStatus> {
  try {
    const result = await Location.getForegroundPermissionsAsync();
    consoleLogDev('[PermissionService] location permission status', result);
    return result.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Returns true if location is currently granted at the OS level,
 * regardless of whether it's "Always allow" or "Only this time".
 * Use this for mid-session checks (e.g. foreground resume guard)
 * where we just need to know if location API calls will work.
 */
export async function isLocationCurrentlyGranted(): Promise<boolean> {
  try {
    const result = await Location.getForegroundPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

/**
 * Check + request location permission in one call.
 * If not already granted, calls requestForegroundPermissionsAsync so
 * the OS dialog appears and the user can grant permission.
 * Call this on the permissions screen and on foreground resume.
 */
export async function ensureLocationPermission(): Promise<PermissionStatus> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    consoleLogDev('[PermissionService] ensureLocation check', current);

    if (current.granted) {
      return 'granted';
    }

    const result = await Location.requestForegroundPermissionsAsync();
    consoleLogDev('[PermissionService] ensureLocation request result', result);
    return result.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Check SMS (READ_SMS) permission status.
 * Android-only — the Credeau SDK uses this for financial SMS analysis.
 * Always returns 'granted' on iOS since the permission doesn't exist there.
 */
async function checkSmsPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }
  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    );
    return granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Check notification permission status via expo-notifications.
 */
async function checkNotificationPermission(): Promise<PermissionStatus> {
  try {
    const status = await requestUserNotificationPermissionStatus();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Check READ_PHONE_STATE permission status.
 * Android-only — used for SIM status, network info, and fraud detection.
 * Always returns 'granted' on iOS since the permission doesn't exist there.
 */
async function checkPhoneStatePermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }
  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    );
    return granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Informational permissions (installed apps, device metadata)
 * are treated as granted once the user has accepted app permissions.
 * There is no meaningful runtime toggle for these, so we surface them
 * as always active in the UI.
 */
async function checkInfoOnlyPermission(): Promise<PermissionStatus> {
  return 'granted';
}

/**
 * Device contacts (expo-contacts). Shown only when enableUpfrontContactsPermission is on.
 */
async function checkContactsPermission(): Promise<PermissionStatus> {
  try {
    const result = await Contacts.getPermissionsAsync();
    return result.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * App Tracking Transparency (iOS 14.5+). Android/web: not applicable — treated as granted.
 */
async function checkAppTrackingTransparencyPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'ios') {
    return 'granted';
  }
  try {
    const { getTrackingPermissionsAsync } = await import('expo-tracking-transparency');
    const result = await getTrackingPermissionsAsync();
    if (result.granted) {
      return 'granted';
    }
    if (result.status === 'undetermined') {
      return 'undetermined';
    }
    return 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Permission checkers map
 */
const PERMISSION_CHECKERS: Record<PermissionType, () => Promise<PermissionStatus>> = {
  camera: checkCameraPermission,
  location: checkLocationPermission,
  sms: checkSmsPermission,
  notifications: checkNotificationPermission,
  appTrackingTransparency: checkAppTrackingTransparencyPermission,
  phoneState: checkPhoneStatePermission,
  installedApps: checkInfoOnlyPermission,
  deviceMetadata: checkInfoOnlyPermission,
  contacts: checkContactsPermission,
};

/**
 * Check status of a specific permission
 */
export async function checkPermissionStatus(
  permissionType: PermissionType,
): Promise<PermissionStatus> {
  const checker = PERMISSION_CHECKERS[permissionType];
  if (!checker) {
    return 'undetermined';
  }
  return checker();
}

/**
 * Check status of all given permissions in parallel
 */
export async function checkAllPermissionStatuses(
  permissionTypes: PermissionType[],
): Promise<PermissionStatusMap> {
  const results = await Promise.all(
    permissionTypes.map(async (type) => ({
      type,
      status: await checkPermissionStatus(type),
    })),
  );

  const statuses: Partial<PermissionStatusMap> = {};
  results.forEach(({ type, status }) => {
    statuses[type] = status;
  });

  return statuses as PermissionStatusMap;
}

/** Permission types required by the app (same set as permissions screen). Uses app-config when available. */
function getRequiredAppPermissions(): PermissionType[] {
  return [
    'camera',
    'location',
    ...(Platform.OS === 'android' && !getByPassSmsPermission() ? (['phoneState'] as const) : []),
    ...(Platform.OS === 'android' && !getByPassSmsPermission() ? (['sms'] as const) : []),
  ];
}

/**
 * Returns true if all required app permissions (camera, location, SMS) are granted.
 * Used on app start to decide whether to show the permissions screen.
 */
export async function areRequiredAppPermissionsGranted(): Promise<boolean> {
  const smsBypassed = getByPassSmsPermission();
  consoleLogDev('[areRequiredAppPermissionsGranted] smsBypassed', smsBypassed);
  const required = getRequiredAppPermissions();
  try {
    const statuses = await checkAllPermissionStatuses(required);
    return required.every((type) => statuses[type] === 'granted');
  } catch {
    return false;
  }
}

/**
 * Returns the list of required app permissions that are not currently granted.
 * Useful for display or logging (e.g. "Missing: camera, location").
 */
export async function getMissingRequiredPermissions(): Promise<PermissionType[]> {
  const required = getRequiredAppPermissions();
  try {
    const statuses = await checkAllPermissionStatuses(required);
    return required.filter((type) => statuses[type] !== 'granted');
  } catch {
    return [...required];
  }
}
