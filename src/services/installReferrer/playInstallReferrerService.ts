import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { PlayInstallReferrerInfo } from 'react-native-play-install-referrer';
import { PlayInstallReferrer } from 'react-native-play-install-referrer';

import { PLAY_INSTALL_REFERRER_CACHE_TTL_MS } from '@/src/config/playInstallReferrer';
import { STORAGE_KEYS } from '@/src/constants/data';
import {
  PLAY_INSTALL_REFERRER_STORED_VERSION,
  type StoredPlayInstallReferrerV1,
} from '@/src/types/playInstallReferrer';
import { consoleLogDev } from '@/src/utils/common-helper';
import {
  pushInstallReferrerCaptured,
  pushInstallReferrerFromCache,
  pushInstallReferrerError,
} from '@/src/services/logging';

const STORAGE_KEY = STORAGE_KEYS.playInstallReferrer;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStoredPlayInstallReferrerV1(value: unknown): value is StoredPlayInstallReferrerV1 {
  if (!isPlainObject(value)) return false;
  if (value.v !== PLAY_INSTALL_REFERRER_STORED_VERSION) return false;
  if (typeof value.capturedAtMs !== 'number' || typeof value.expiresAtMs !== 'number') {
    return false;
  }
  if (!isPlainObject(value.info)) return false;
  const info = value.info;
  if (typeof info.installReferrer !== 'string') return false;
  return true;
}

function getInstallReferrerInfoAsync(): Promise<PlayInstallReferrerInfo> {
  return new Promise((resolve, reject) => {
    try {
      PlayInstallReferrer.getInstallReferrerInfo((info, error) => {
        if (error) {
          reject(error);
          return;
        }
        if (!info) {
          reject(new Error('Play install referrer returned no info'));
          return;
        }
        resolve(info);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function readRawFromStorage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function removeStored(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore secondary storage errors.
  }
}

async function writeStored(payload: StoredPlayInstallReferrerV1): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Returns cached Play Install Referrer data if present and not expired; otherwise null.
 * Expired entries are removed from storage.
 */
export async function getCachedPlayInstallReferrer(): Promise<StoredPlayInstallReferrerV1 | null> {
  const raw = await readRawFromStorage();
  if (raw == null || raw.length === 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    await removeStored();
    return null;
  }

  if (!isStoredPlayInstallReferrerV1(parsed)) {
    await removeStored();
    return null;
  }

  if (Date.now() > parsed.expiresAtMs) {
    await removeStored();
    return null;
  }

  return parsed;
}

export async function getPlayInstallReferrerForAuthPayload(): Promise<
  Record<string, string> | undefined
> {
  if (Platform.OS !== 'android') return undefined;

  let cached = await getCachedPlayInstallReferrer();
  if (!cached) {
    // OTP verification can happen before startup tasks complete on slower devices.
    await ensurePlayInstallReferrer();
    cached = await getCachedPlayInstallReferrer();
  }
  consoleLogDev('[PlayInstallReferrer] Using cached install referrer', cached);
  pushInstallReferrerFromCache(cached?.info.installReferrer ?? '', cached?.info.installVersion ?? '');

  const installReferrer = cached?.info.installReferrer?.trim();
  if (!installReferrer) return undefined;

  const params: Record<string, string> = {};
  const pairs = installReferrer.split('&');
  for (const pair of pairs) {
    if (!pair) continue;
    const [rawKey, rawValue] = pair.split('=');
    const key = rawKey?.trim();
    const value = rawValue?.trim();
    if (!key || !value) continue;
    params[key] = value;
  }

  return Object.keys(params).length > 0 ? params : undefined;
}

/**
 * On Android, ensures install referrer is fetched once and cached with TTL.
 * No-op on other platforms. Skips native call when a valid cache exists.
 */
export async function ensurePlayInstallReferrer(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const existing = await getCachedPlayInstallReferrer();
  if (existing) {
    consoleLogDev('[PlayInstallReferrer] Using cached install referrer', existing);
    pushInstallReferrerFromCache(
      existing.info.installReferrer ?? '',
      existing.info.installVersion ?? ''
    );
    return;
  }

  try {
    const info = await getInstallReferrerInfoAsync();
    const capturedAtMs = Date.now();
    const payload: StoredPlayInstallReferrerV1 = {
      v: PLAY_INSTALL_REFERRER_STORED_VERSION,
      info,
      capturedAtMs,
      expiresAtMs: capturedAtMs + PLAY_INSTALL_REFERRER_CACHE_TTL_MS,
    };
    await writeStored(payload);

    /** eg: payload
     * { v: 1,
     *  info: {
     *   installBeginTimestampServerSeconds: '1775473261',
     *   referrerClickTimestampSeconds: '0',
     *   installBeginTimestampSeconds: '1775473262',
     *   installVersion: '1.0.10',
     *   referrerClickTimestampServerSeconds: '0',
     *   googlePlayInstant: 'false',
     *   installReferrer: 'utm_source=google-play&utm_medium=organic'
     * }
     * capturedAtMs: 1775473262,
     * expiresAtMs: 1775473262 + 30 * 24 * 60 * 60 * 1000,
     */
    consoleLogDev('[PlayInstallReferrer] Install referrer cached', payload);
    pushInstallReferrerCaptured(
      info.installReferrer ?? '',
      info.installVersion ?? ''
    );
  } catch (error) {
    consoleLogDev('[PlayInstallReferrer] Failed to read install referrer', error);
    pushInstallReferrerError(error);
  }
}
