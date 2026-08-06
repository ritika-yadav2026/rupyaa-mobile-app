import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
    getUniqueId,
    getManufacturer,
    isLowRamDevice,
    isEmulator,
    getApiLevelSync,
    getFingerprintSync,
    getVersion,
    getBuildNumber,
    getSystemVersion,
    getDeviceId,
    getModel,
    getBrand,
    getHostSync,
    getHardwareSync,
    getBootloaderSync,
    getReadableVersion,
    getBuildIdSync,
    getSerialNumber
} from 'react-native-device-info'
import { getAdjustAttributionIdsForSaveAppInfo } from '@/src/services/attribution';

export type UserSaveAppInfoPayload = {
  platform: string;
  adid: string | null;
  gps_adid: string | null;
  idfa: string | null;
  idfv: string | null;
  device: string | null;
  version_number: number;
  version_name: string | null;
  os_version: string;
  sdk_version: string | null;
  buildId: string | null;
  deviceModel: string | null;
  manufacturer: string | null;
  host: string | null;
  hardware: string | null;
  bootloader: string | null;
  isLowRamDevice: boolean | null;
  board: string | null;
  phoneBrand: string | null;
  fingerPrint: string | null;
  isPhysicalDevice: boolean | null;
  serialNumber: string | null;
  udid: string | null;
  isIosAppOnMac: boolean;
  buildVersion: string;
};

type UseUserSaveAppInfoPayloadReturn = {
  appInfoPayload: UserSaveAppInfoPayload | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export async function getUserSaveAppInfoPayload(): Promise<UserSaveAppInfoPayload> {
  const uniqueId = await getUniqueId();
  const manufacturer = await getManufacturer();
  const isLowRamDeviceValue = Platform.OS === 'android' ? isLowRamDevice() : null;
  const isEmulatorValue = await isEmulator();
  const serialNumberValue = await getSerialNumber();
  const getApiLevelValue = getApiLevelSync() ?? null;
  const getFingerprintValue = getFingerprintSync() ?? null;
  const versionNameValue = getVersion();
  const buildNumberValue = getBuildNumber();
  const attributionIds = await getAdjustAttributionIdsForSaveAppInfo();

  return {
    platform: Platform.OS,
    adid: attributionIds.adid,
    gps_adid: attributionIds.gps_adid,
    idfa: attributionIds.idfa,
    idfv: attributionIds.idfv,
    device: getDeviceId() ?? null,
    version_number: Number(buildNumberValue ?? 0),
    version_name: versionNameValue ?? null,
    os_version: String(getSystemVersion() ?? ''),
    sdk_version: Platform.OS === 'android' && getApiLevelValue != null ? String(getApiLevelValue) : null,
    buildId: getBuildIdSync() ?? null,
    deviceModel: getModel() ?? null,
    manufacturer: manufacturer ?? null,
    host: getHostSync() ?? null,
    hardware: getHardwareSync() ?? null,
    bootloader: getBootloaderSync() ?? null,
    isLowRamDevice: isLowRamDeviceValue ?? null,
    board: getDeviceId() ?? null,
    phoneBrand: getBrand() ?? null,
    fingerPrint: Platform.OS === 'android' ? getFingerprintValue ?? null : null,
    isPhysicalDevice: !isEmulatorValue,
    serialNumber: serialNumberValue ?? null,
    udid: uniqueId ?? null,
    isIosAppOnMac: false,
    buildVersion: getReadableVersion() ?? `${versionNameValue ?? ''} + ${buildNumberValue ?? ''}`,
  };
}

export function useUserSaveAppInfoPayload(): UseUserSaveAppInfoPayloadReturn {
  const [appInfoPayload, setAppInfoPayload] = useState<UserSaveAppInfoPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAppInfoPayload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await getUserSaveAppInfoPayload();
      setAppInfoPayload(payload);
    } catch (err) {
      const parsedError =
        err instanceof Error ? err : new Error('Failed to fetch app info payload');

      setError(parsedError);
      setAppInfoPayload(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppInfoPayload();
  }, [fetchAppInfoPayload]);

  return {
    appInfoPayload,
    isLoading,
    error,
    refetch: fetchAppInfoPayload,
  };
}
