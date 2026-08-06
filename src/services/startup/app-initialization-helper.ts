import { Platform } from "react-native";
import Constants from "expo-constants";
import { apiConfig, apiHeaders, API_ENDPOINTS } from "@/src/config/api";
import { appConfig } from "@/src/config/appConfig";
import { IAppUpdateCheckResponse } from "@/src/types/app-updates";
import {
  decryptResponse,
  looksLikeEncryptedResponse,
} from "@/src/utils/crypto";
import { useUpdateStore } from "@/src/store/updateStore";
import { nativeUpdateHelper } from "./nativeUpdateHelper";
import { getCachedGeoLocationString } from "../location/geoLocation";
import { getOrCreateDeviceId } from "@/src/utils/deviceId-helper";
import { consoleLogDev } from "@/src/utils/common-helper";

async function checkAppUpdate(): Promise<IAppUpdateCheckResponse | null> {
  if (!appConfig.enableStartupApis) {
    return null;
  }

  try {
    const appVersion =
      Constants.expoConfig?.version ??
      apiConfig.appVersion ??
      appConfig.appVersion;

    const params = new URLSearchParams({
      platform: Platform.OS,
      appVersion,
    });

    const url = `${apiConfig.baseUrl}${API_ENDPOINTS.app.updateCheck}?${params.toString()}`;
    const [deviceId, geoLocationStr] = await Promise.all([
      getOrCreateDeviceId(),
      getCachedGeoLocationString(),
    ]);
    const headers: Record<string, string> = {
      'X-Device-Id': deviceId,
      'X-Geo-Location': geoLocationStr,
      ...apiHeaders.getCommon(),
    };
    const response = await fetch(url, {
      method: "GET",
	    cache: "no-store",
      headers,
    });

    if (!response.ok) {
      consoleLogDev("WARN:: checkAppUpdate non-2xx status", response.status);
      return null;
    }

    let data: unknown = await response.json();
    if (
      data !== null &&
      typeof data === "object" &&
      looksLikeEncryptedResponse(data)
    ) {
      data = await decryptResponse<IAppUpdateCheckResponse>(data);
    }
    const parsed = data as IAppUpdateCheckResponse;

    if (!parsed || parsed.success !== true) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.log("WARN:: checkAppUpdate failed", err);
    return null;
  }
}


export async function checkAndPromptForMinMajorVersion(): Promise<void> {
	const updateInfo: IAppUpdateCheckResponse | null = await checkAppUpdate();
	if (!updateInfo || !updateInfo.updateRequired) return;

	const { forceUpdate, currentProductionVersion, releaseNotes } = updateInfo;
  const enableForceUpdate = forceUpdate && !__DEV__;
	const storeUrl: string = Platform.OS === 'ios' ? appConfig.appStoreUrl : appConfig.playStoreUrl;
	const params = {
		releaseNotes: String(releaseNotes ?? ''),
		storeUrl,
		version: currentProductionVersion,
	};

	if (enableForceUpdate) {
		useUpdateStore.getState().showForceUpdate(params);
		return;
	}

	// Optional update: show only once per production version until API returns a new one.
	const skipped = await nativeUpdateHelper.getSkippedUpdateVersion();

	consoleLogDev("APP UPDATE CHECK:: Skipped version", skipped, "Current version", currentProductionVersion);
	if (skipped === currentProductionVersion) return;

	if(!__DEV__) {
    useUpdateStore.getState().showOptionalUpdate(params);
  }
}