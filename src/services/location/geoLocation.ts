import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { STORAGE_KEYS } from '@/src/constants/data';
import { devConfig } from '@/src/config/dev';
import { consoleLogDev } from '@/src/utils/common-helper';

/**
 * Shape for geo location used in e-sign and other APIs.
 * Latitude and longitude as strings (e.g. "12.345" "-67.890").
 */
export interface GeoLocationEsign {
  latitude: number;
  longitude: number;
}

const EMPTY_GEO: GeoLocationEsign = { latitude: 0, longitude: 0 };
const CACHED_FALLBACK = '0,0';

function isValidCoordinate(value?: number | null): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function toGeoLocation(
  coords?: Partial<Location.LocationObjectCoords> | null
): GeoLocationEsign {
  return {
    latitude: isValidCoordinate(coords?.latitude) ? coords.latitude : 0,
    longitude: isValidCoordinate(coords?.longitude) ? coords.longitude : 0,
  };
}

function hasValidGeo(geo: GeoLocationEsign): boolean {
  return geo.latitude !== 0 || geo.longitude !== 0;
}

async function storeGeoLocation(geo: GeoLocationEsign): Promise<void> {
  const value = `${geo.latitude},${geo.longitude}`;
  await AsyncStorage.setItem(STORAGE_KEYS.GEO_LOCATION, value);

  if (devConfig.enableDebugLogs) {
    consoleLogDev('[GeoLocation] Stored geo ->', value);
  }
}

async function storeFallbackGeo(reason: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GEO_LOCATION, CACHED_FALLBACK);

    if (devConfig.enableDebugLogs) {
      consoleLogDev(`[GeoLocation] Stored fallback geo 0,0 (${reason})`);
    }
  } catch {
    // Ignore secondary storage errors.
  }
}

/**
 * Get cached geo location from AsyncStorage (fast, non-blocking).
 * Returns "latitude,longitude" string for API headers.
 * Use this for general API requests to avoid slow GPS on every call.
 */
export async function getCachedGeoLocationString(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.GEO_LOCATION);
    const value = stored ?? CACHED_FALLBACK;
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[GeoLocation] getCachedGeoLocationString ->', value);
    }
    return value;
  } catch {
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[GeoLocation] getCachedGeoLocationString -> error, using fallback 0,0');
    }
    return CACHED_FALLBACK;
  }
}

/**
 * Fetch fresh location, store in AsyncStorage, and return it.
 * Only fetches if location permission is already granted — never triggers
 * a permission popup. Safe to call during app startup before the consent screen.
 */
export async function refreshAndStoreGeoLocation(): Promise<GeoLocationEsign> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (devConfig.enableDebugLogs) {
      consoleLogDev('[GeoLocation] refreshAndStoreGeoLocation -> permission status', status);
    }

    if (status !== 'granted') {
      await storeFallbackGeo('permission not granted');
      return EMPTY_GEO;
    }

    // 1) Try last known first for speed and simulator friendliness
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (devConfig.enableDebugLogs) {
        consoleLogDev('[GeoLocation] getLastKnownPositionAsync ->', lastKnown);
      }

      const lastKnownGeo = toGeoLocation(lastKnown?.coords);
      if (hasValidGeo(lastKnownGeo)) {
        await storeGeoLocation(lastKnownGeo);
        return lastKnownGeo;
      }
    } catch (error) {
      if (devConfig.enableDebugLogs) {
        consoleLogDev('[GeoLocation] getLastKnownPositionAsync error ->', error);
      }
    }

    // 2) Fallback to fresh fetch
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: false,
    });

    if (devConfig.enableDebugLogs) {
      consoleLogDev('[GeoLocation] getCurrentPositionAsync ->', position);
    }

    const geo = toGeoLocation(position?.coords);

    if (!hasValidGeo(geo)) {
      await storeFallbackGeo('invalid current location');
      return EMPTY_GEO;
    }

    await storeGeoLocation(geo);
    return geo;
  } catch (error) {
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[GeoLocation] refreshAndStoreGeoLocation error ->', error);
    }

    await storeFallbackGeo('error fetching geo');
    return EMPTY_GEO;
  }
}

/**
 * Parse cached "lat,long" string into GeoLocationEsign.
 * Returns EMPTY_GEO if invalid or "0,0".
 */
function parseCachedGeoLocationString(value: string): GeoLocationEsign {
  if (!value || value === CACHED_FALLBACK) return EMPTY_GEO;
  const parts = value.split(',');
  if (parts.length !== 2) return EMPTY_GEO;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return EMPTY_GEO;
  return { latitude: lat, longitude: lng };
}

/**
 * Get geo location for e-sign and mandate APIs.
 * Uses cached coordinates (fast) when available; falls back to GPS fetch only when
 * cache is empty or invalid.
 *
 * Coordinates are refreshed when permission is granted (useLocationPermissionGate)
 * and on app startup (useAppStartup), so cache is usually valid.
 */
export async function getGeoLocationForEsignOrMandate(): Promise<GeoLocationEsign> {
  const cached = await getCachedGeoLocationString();
  const parsed = parseCachedGeoLocationString(cached);

  if (hasValidGeo(parsed)) {
    return parsed;
  }

  return getUserGeoLocation();
}

/**
 * Get the device's current geographic location for use in e-sign and other flows.
 * Requests foreground location permission if not already granted.
 * Returns { latitude: 0, longitude: 0 } on permission denied, timeout, or error
 * so callers can still send the expected shape to the API.
 *
 * Use for EsignStep and mandate creation where fresh location is required.
 */
export async function getUserGeoLocation(): Promise<GeoLocationEsign> {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();

    if (status !== 'granted') {
      const { status: requested } = await Location.requestForegroundPermissionsAsync();
      status = requested;
    }

    if (status !== 'granted') {
      return EMPTY_GEO;
    }

    // 1) Try last known first
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();

      if (devConfig.enableDebugLogs) {
        consoleLogDev('[GeoLocation] getUserGeoLocation lastKnown ->', lastKnown);
      }

      const lastKnownGeo = toGeoLocation(lastKnown?.coords);

      if (hasValidGeo(lastKnownGeo)) {
        try {
          await storeGeoLocation(lastKnownGeo);
        } catch {
          // Ignore storage errors.
        }
        return lastKnownGeo;
      }
    } catch (error) {
      if (devConfig.enableDebugLogs) {
        consoleLogDev('[GeoLocation] getUserGeoLocation lastKnown error ->', error);
      }
    }

    // 2) Fallback to fresh current location
    const position = await Location.getCurrentPositionAsync({
      // Coarse location only (ACCESS_COARSE_LOCATION); fine location is stripped for Play Loans policy.
      accuracy: Location.Accuracy.Low,
      mayShowUserSettingsDialog: true,
    });

    if (devConfig.enableDebugLogs) {
      consoleLogDev('[GeoLocation] getUserGeoLocation current ->', position);
    }

    const geo = toGeoLocation(position?.coords);

    if (hasValidGeo(geo)) {
      try {
        await storeGeoLocation(geo);
      } catch {
        // Ignore storage errors.
      }
    }

    return geo;
  } catch (error) {
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[GeoLocation] getUserGeoLocation error ->', error);
    }
    return EMPTY_GEO;
  }
}