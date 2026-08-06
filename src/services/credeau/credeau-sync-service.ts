// iOS NOTE — react-native-collect-data (Credeau SDK):
//   The module's podspec depends on `CollectDeviceIOSData`, a private CocoaPod that
//   is NOT on the public CocoaPods trunk. To prevent iOS builds from failing, iOS
//   native auto-linking for this module is disabled in react-native.config.js.
//
//   All call-sites below are guarded by Platform.OS !== 'android', so this module
//   is never invoked on iOS. If Credeau later provides iOS device-sync support,
//   add their private pod source to app.config.js and remove the ios:null exclusion
//   from react-native.config.js.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { startBackGroundSyncProcess } from 'react-native-collect-data';
import { STORAGE_KEYS } from '@/src/constants/data';
import { API_ENDPOINTS } from '@/src/config/api';
import {
  getByPassSmsPermission,
  getCredeauServerUrl,
  getCredeauClientName,
  getCredeauClientKey,
  getBackgroundSyncIntervalSeconds,
  getMaxSmsToSync,
} from '@/src/config/resolvedAppConfig';
import { apiClient } from '@/src/services/api/apiClient';
import { logNonFatalError } from '@/src/utils/nonFatalError';
import { fetchAndStoreUserPersonalDetails } from '@/src/services/user';
import {
  logPool,
  logPoolMessages,
  formatLogPoolUnknownError,
  persistLogPoolPhoneNumber,
  resolveLogPoolPhoneNumber,
} from '@/src/services/logging';
import SmsAndroid from 'react-native-get-sms-android';

const PERMISSION_GRANTED_VALUE = 'true';
const CREDEAU_LOG_TAG = '[CredeauSync]';
const SMS_LIST_TIMEOUT_MS = 15000;

/**
 * Max SMS rows to pull per `SmsAndroid.list` native call (library pagination).
 * Example: 1000 recent cap with 250/page => up to 4 native reads before POST batches.
 */
const SMS_ANDROID_LIST_PAGE_SIZE = 250;

/**
 * First-time / full sync: take the **oldest** N inbox rows (chronological baseline).
 * Verify in logs: `phase: 'oldestFirst'`, `SMS_SYNC_OLDEST_FIRST_COUNT`.
 */
export const SMS_SYNC_OLDEST_FIRST_COUNT = 200;

/**
 * Rolling window for the **recent** segment: messages with `date >= now - window`.
 * ~6 calendar months (183 days). Verify in logs: `minDate`, `phase: 'recentSixMonths'`.
 */
export const SMS_SYNC_RECENT_WINDOW_MS = 183 * 24 * 60 * 60 * 1000;

/**
 * Max messages to collect from the **recent** window (newest first, `date DESC`).
 * Example: "1000 six months latest" — verify `recentSegmentMax` in logs.
 */
export const SMS_SYNC_RECENT_MAX_COUNT = 1000;

/**
 * Max items per **single** `POST /user/save-user-sms` body (`smsArray` length).
 * Example: 1200 deduped rows => four API calls (300×4). Verify `saveApiBatchIndex`.
 */
export const SMS_SAVE_API_BATCH_SIZE = 300;

/**
 * Server `lastSmsSyncedAt` must be older than this (ms) before we run **incremental** upload.
 * If newer, we skip inbox read+POST (verify `skipReason: 'serverWatermarkWithin24h'`).
 */
export const SMS_SYNC_SERVER_MIN_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * When personal-details has **no** `lastSmsSyncedAt`, throttle repeat opens via local timestamp.
 * Same duration as server gate for predictable QA (verify `skipReason: 'localIntervalWithin24h'`).
 */
const SMS_INBOX_SYNC_LOCAL_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function isSmsPermissionGrantedOrBypassed(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (getByPassSmsPermission()) return true;

  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
  } catch {
    // If we can't read permission status, assume not granted so we don't trigger prompts.
    return false;
  }
}

type SmsListItem = {
  _id?: string;
  address?: string;
  body?: string;
  date?: string;
  read?: number | string;
  [key: string]: unknown;
};

type SaveUserSmsRequestItem = {
  body: string;
  sender: string;
  date: number;
};

type SaveUserSmsRequest = {
  smsArray: SaveUserSmsRequestItem[];
  /** Signals the final batch of the sync session. Server uses this to update lastSmsSyncedAt. */
  isFinal: boolean;
};

type ReadInboxMessagesOptions = {
  indexFrom?: number;
  maxCount?: number;
  minDate?: number;
  maxDate?: number;
  sortOrder?: string;
};

export type CredeauBackgroundSyncOptions = {
  lastSmsSyncedAt?: number;
  /** Epoch ms of the most recent SMS already on server. Used to filter local SMS. */
  latestSmsDate?: number;
};

/**
 * Parses lastSmsSyncedAt from personal-details (epoch ms, numeric string, or ISO).
 */
export function parseLastSmsSyncedAt(
  value: number | string | undefined | null
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const asNum = Number(value);
    if (Number.isFinite(asNum)) {
      return asNum;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

/**
 * Saves granted permissions state for future app launches.
 */
export async function saveCredeauPermissionGranted(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.hasGrantedPermissions, PERMISSION_GRANTED_VALUE);
}

/**
 * Checks whether permissions were granted in a previous session.
 */
export async function checkCredeauPermissionGranted(): Promise<boolean> {
  const permissionValue = await AsyncStorage.getItem(STORAGE_KEYS.hasGrantedPermissions);
  return permissionValue === PERMISSION_GRANTED_VALUE;
}

/**
 * Persists the permissions checkpoint and starts Credeau sync when SMS is usable.
 * Used by the permissions screen and the loan-journey permission gate.
 */
export async function triggerCredeauSyncAfterSmsPermissionGranted(): Promise<void> {
  console.log(`${CREDEAU_LOG_TAG} SMS permission granted — saving checkpoint and starting sync`);
  await saveCredeauPermissionGranted();
  void executeCredeauSyncOnAppOpen();
}

const toSafeEpoch = (dateValue: string | number | undefined): number | undefined => {
  if (typeof dateValue === 'number' && Number.isFinite(dateValue)) return dateValue;
  if (typeof dateValue === 'string' && dateValue.trim().length > 0) {
    const parsed = Number(dateValue);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const mapSmsForServer = (messages: SmsListItem[]): SaveUserSmsRequestItem[] => {
  return messages
    .map((message) => {
      const body = typeof message.body === 'string' ? message.body.trim() : '';
      const sender = typeof message.address === 'string' ? message.address.trim() : '';
      const date = toSafeEpoch(message.date);
      if (!body || !sender || date === undefined) {
        return undefined;
      }
      return {
        body,
        sender,
        date,
      };
    })
    .filter((item): item is SaveUserSmsRequestItem => item !== undefined);
};

/** Dedupe native rows before POST (oldest+recent windows can overlap). */
function dedupeSmsListItems(items: SmsListItem[]): SmsListItem[] {
  const seen = new Set<string>();
  const out: SmsListItem[] = [];
  for (const m of items) {
    const id =
      m._id != null && String(m._id).length > 0
        ? `id:${m._id}`
        : `f:${toSafeEpoch(m.date) ?? 0}|${String(m.address ?? '')}|${String(m.body ?? '').slice(0, 120)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(m);
  }
  return out;
}

/**
 * Uploads mapped SMS in chunks of {@link SMS_SAVE_API_BATCH_SIZE} per POST (e.g. 300×4 for 1200).
 *
 * Batch signaling:
 * - Batches 1 to N-1: `isFinal: false`
 * - Batch N (last): `isFinal: true` — signals server to update `lastSmsSyncedAt`
 */
async function saveInboxMessagesInApiBatches(
  messages: SmsListItem[],
  context: { phase: string; dedupedTotal: number }
): Promise<void> {
  const smsArray = mapSmsForServer(messages);
  if (smsArray.length === 0) {
    console.warn(`${CREDEAU_LOG_TAG} No valid inbox messages to upload`, context);
    return;
  }

  const batchSize = SMS_SAVE_API_BATCH_SIZE;
  const batchCount = Math.ceil(smsArray.length / batchSize);
  console.log(`${CREDEAU_LOG_TAG} save-user-sms batching`, {
    ...context,
    validRows: smsArray.length,
    batchSize,
    batchCount,
    endpoint: API_ENDPOINTS.user.saveUserSms,
  });

  for (let i = 0; i < smsArray.length; i += batchSize) {
    const slice = smsArray.slice(i, i + batchSize);
    const saveApiBatchIndex = Math.floor(i / batchSize) + 1;
    const isLastBatch = saveApiBatchIndex === batchCount;
    const payload: SaveUserSmsRequest = {
      smsArray: slice,
      isFinal: isLastBatch,
    };

    console.log(`${CREDEAU_LOG_TAG} POST save-user-sms`, {
      ...context,
      saveApiBatchIndex,
      saveApiBatchTotal: batchCount,
      chunkLen: slice.length,
      isFinal: isLastBatch,
    });

    const response = await apiClient.post<unknown>(API_ENDPOINTS.user.saveUserSms, payload);
    if (!response.success) {
      console.error(`${CREDEAU_LOG_TAG} save-user-sms API failure`, {
        ...context,
        saveApiBatchIndex,
        error: response.error,
        status: response.status,
        attemptedCount: slice.length,
        isFinal: isLastBatch,
      });
      throw new Error(response.error.message || 'Failed to save inbox messages');
    }

    console.log(`${CREDEAU_LOG_TAG} save-user-sms API success`, {
      ...context,
      saveApiBatchIndex,
      syncedCount: slice.length,
      status: response.status,
      isFinal: isLastBatch,
    });
  }
}

function buildSmsListFilter(options: ReadInboxMessagesOptions): Record<string, unknown> {
  const indexFrom = options.indexFrom ?? 0;
  const maxCount = options.maxCount ?? SMS_ANDROID_LIST_PAGE_SIZE;
  const filter: Record<string, unknown> = {
    box: 'inbox',
    indexFrom,
    maxCount,
    sortOrder: options.sortOrder ?? 'date DESC',
  };
  if (options.minDate !== undefined) {
    filter.minDate = options.minDate;
  }
  if (options.maxDate !== undefined) {
    filter.maxDate = options.maxDate;
  }
  return filter;
}

export async function readInboxMessages(
  options: ReadInboxMessagesOptions = {}
): Promise<SmsListItem[]> {
  console.log(`${CREDEAU_LOG_TAG} readInboxMessages called`, {
    platform: Platform.OS,
    indexFrom: options.indexFrom ?? 0,
    maxCount: options.maxCount ?? SMS_ANDROID_LIST_PAGE_SIZE,
    minDate: options.minDate,
    sortOrder: options.sortOrder ?? 'date DESC',
  });

  if (Platform.OS !== 'android') {
    console.warn(`${CREDEAU_LOG_TAG} SMS reading is only supported on Android`);
    return [];
  }

  // Some app-config deployments bypass SMS permission prompts; in that case we
  // should not request READ_SMS at runtime (avoids system prompt on Android).
  if (getByPassSmsPermission()) {
    console.warn(`${CREDEAU_LOG_TAG} SMS bypass enabled - skipping inbox read`);
    return [];
  }

  const isSmsModuleAvailable = Boolean(SmsAndroid && typeof SmsAndroid.list === 'function');
  console.log(`${CREDEAU_LOG_TAG} SmsAndroid module availability`, {
    isSmsModuleAvailable,
    hasNativeModuleByName: Boolean(NativeModules?.Sms || NativeModules?.GetSmsAndroid),
  });

  if (!isSmsModuleAvailable) {
    const moduleError = new Error('SmsAndroid native module unavailable: list is not a function');
    console.error(`${CREDEAU_LOG_TAG} SmsAndroid module unavailable`, {
      hasNativeModuleByName: Boolean(NativeModules?.Sms || NativeModules?.GetSmsAndroid),
      nativeModuleKeys: Object.keys(NativeModules ?? {}).slice(0, 30),
    });
    throw moduleError;
  }

  const hasSmsPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
  const granted = hasSmsPermission
    ? PermissionsAndroid.RESULTS.GRANTED
    : await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
  console.log(`${CREDEAU_LOG_TAG} READ_SMS permission result`, { granted });

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    const filter = buildSmsListFilter(options);
    console.log(`${CREDEAU_LOG_TAG} Fetching inbox SMS`, { filter });

    return new Promise<SmsListItem[]>((resolve, reject) => {
      let isSettled = false;
      const timeoutId = setTimeout(() => {
        if (isSettled) {
          return;
        }
        isSettled = true;
        const timeoutError = new Error(
          `SmsAndroid.list callback not received within ${SMS_LIST_TIMEOUT_MS}ms`
        );
        console.error(`${CREDEAU_LOG_TAG} SmsAndroid.list timeout`, {
          timeoutMs: SMS_LIST_TIMEOUT_MS,
          filter,
        });
        reject(timeoutError);
      }, SMS_LIST_TIMEOUT_MS);

      console.log(`${CREDEAU_LOG_TAG} Invoking SmsAndroid.list`);
      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: unknown) => {
          if (isSettled) {
            console.warn(`${CREDEAU_LOG_TAG} SmsAndroid.list failure callback after settle`, {
              error: fail,
            });
            return;
          }
          isSettled = true;
          clearTimeout(timeoutId);
          console.error(`${CREDEAU_LOG_TAG} SmsAndroid.list failed`, {
            error: fail,
          });
          reject(fail);
        },
        (count: unknown, smsList: string) => {
          if (isSettled) {
            console.warn(`${CREDEAU_LOG_TAG} SmsAndroid.list success callback after settle`, {
              count,
            });
            return;
          }
          isSettled = true;
          clearTimeout(timeoutId);
          console.log(`${CREDEAU_LOG_TAG} SmsAndroid.list success`, { count });
          try {
            const parsedSmsList = JSON.parse(smsList) as SmsListItem[];
            console.log(`${CREDEAU_LOG_TAG} Parsed inbox SMS list`, {
              count: parsedSmsList.length,
            });
            resolve(parsedSmsList);
          } catch (parseError) {
            console.error(`${CREDEAU_LOG_TAG} Failed to parse smsList payload`, {
              parseError,
              reportedCount: count,
            });
            reject(parseError);
          }
        }
      );
    });
  } else {
    console.warn(`${CREDEAU_LOG_TAG} SMS permission denied`, { granted });
    return [];
  }
}

/**
 * Paginate native reads until `maxTotal` rows or empty page.
 */
async function readInboxPaginated(params: {
  maxTotal: number;
  minDate?: number;
  maxDate?: number;
  sortOrder: string;
  phase: string;
}): Promise<SmsListItem[]> {
  const { maxTotal, minDate, maxDate, sortOrder, phase } = params;
  const collected: SmsListItem[] = [];
  let indexFrom = 0;
  let nativePage = 0;

  while (collected.length < maxTotal) {
    const pageSize = Math.min(SMS_ANDROID_LIST_PAGE_SIZE, maxTotal - collected.length);
    const page = await readInboxMessages({
      indexFrom,
      maxCount: pageSize,
      minDate,
      maxDate,
      sortOrder,
    });

    nativePage += 1;
    console.log(`${CREDEAU_LOG_TAG} native list page`, {
      phase,
      nativePage,
      indexFrom,
      pageLen: page.length,
      pageSize,
      maxTotal,
      minDate,
      sortOrder,
    });

    if (page.length === 0) {
      break;
    }
    collected.push(...page);
    indexFrom += page.length;
    if (page.length < pageSize) {
      break;
    }
  }

  return collected.slice(0, maxTotal);
}

/** True if server watermark is too fresh — skip inbox upload until next day. */
function shouldSkipInboxDueToServerWatermark(lastSmsSyncedAt: number | undefined): boolean {
  if (lastSmsSyncedAt === undefined) return false;
  const age = Date.now() - lastSmsSyncedAt;
  const skip = age < SMS_SYNC_SERVER_MIN_AGE_MS;
  console.log(`${CREDEAU_LOG_TAG} server watermark check`, {
    lastSmsSyncedAt,
    ageMs: age,
    minAgeMs: SMS_SYNC_SERVER_MIN_AGE_MS,
    skipInbox: skip,
  });
  return skip;
}

async function shouldAllowLocalInboxInterval(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.lastLocalInboxSmsSyncAt);
    if (raw === null || raw.trim().length === 0) {
      return true;
    }
    const lastMs = Number(raw);
    if (!Number.isFinite(lastMs)) {
      return true;
    }
    const elapsed = Date.now() - lastMs;
    return elapsed >= SMS_INBOX_SYNC_LOCAL_MIN_INTERVAL_MS;
  } catch {
    return true;
  }
}

async function persistLastLocalInboxSmsSyncAt(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.lastLocalInboxSmsSyncAt, String(Date.now()));
  } catch {
    // Non-fatal: next open may re-run inbox sync sooner than 24h.
  }
}

/**
 * First-time sync (no server watermark): oldest {@link SMS_SYNC_OLDEST_FIRST_COUNT} (ASC)
 * plus up to {@link SMS_SYNC_RECENT_MAX_COUNT} within {@link SMS_SYNC_RECENT_WINDOW_MS} (DESC).
 */
async function syncFirstRunHybridInbox(): Promise<void> {
  const now = Date.now();
  const recentMinDate = now - SMS_SYNC_RECENT_WINDOW_MS;

  console.log(`${CREDEAU_LOG_TAG} first-run hybrid start`, {
    SMS_SYNC_OLDEST_FIRST_COUNT,
    SMS_SYNC_RECENT_MAX_COUNT,
    SMS_SYNC_RECENT_WINDOW_MS,
    recentMinDate,
    now,
  });

  const oldest = await readInboxPaginated({
    maxTotal: SMS_SYNC_OLDEST_FIRST_COUNT,
    sortOrder: 'date ASC',
    phase: 'oldestFirst',
  });

  console.log(`${CREDEAU_LOG_TAG} segment collected`, {
    phase: 'oldestFirst',
    sortOrder: 'date ASC',
    rawCount: oldest.length,
  });

  const recent = await readInboxPaginated({
    maxTotal: SMS_SYNC_RECENT_MAX_COUNT,
    minDate: recentMinDate,
    sortOrder: 'date DESC',
    phase: 'recentSixMonths',
  });

  console.log(`${CREDEAU_LOG_TAG} segment collected`, {
    phase: 'recentSixMonths',
    sortOrder: 'date DESC',
    minDate: recentMinDate,
    rawCount: recent.length,
  });

  const merged = dedupeSmsListItems([...oldest, ...recent]);
  console.log(`${CREDEAU_LOG_TAG} dedupe after oldest+recent`, {
    oldestRaw: oldest.length,
    recentRaw: recent.length,
    dedupedTotal: merged.length,
    SMS_SAVE_API_BATCH_SIZE,
  });

  await saveInboxMessagesInApiBatches(merged, {
    phase: 'firstRunHybrid',
    dedupedTotal: merged.length,
  });
}

/**
 * Incremental: only rows after server's `latestSmsDate`, clamped to rolling 6-month window.
 * Cap by `min(app-config maxSmsToSync, SMS_SYNC_RECENT_MAX_COUNT)` for verification.
 *
 * @param latestSmsDate - Epoch ms of the most recent SMS already stored on server.
 *                        Local SMS with `date > latestSmsDate` are uploaded.
 */
async function syncIncrementalInbox(latestSmsDate: number): Promise<void> {
  const now = Date.now();
  const windowStart = now - SMS_SYNC_RECENT_WINDOW_MS;
  // Filter local SMS where date > latestSmsDate (use +1 to exclude already-synced message)
  const minDate = Math.max(latestSmsDate + 1, windowStart);
  const maxFromConfig = getMaxSmsToSync();
  const incrementalCap = Math.min(maxFromConfig, SMS_SYNC_RECENT_MAX_COUNT);

  console.log(`${CREDEAU_LOG_TAG} incremental sync start`, {
    latestSmsDate,
    windowStart,
    minDate,
    incrementalCap,
    maxFromConfig,
    SMS_SYNC_RECENT_MAX_COUNT,
  });

  const rows = await readInboxPaginated({
    maxTotal: incrementalCap,
    minDate,
    sortOrder: 'date DESC',
    phase: 'incrementalFiltered',
  });

  console.log(`${CREDEAU_LOG_TAG} incremental collected`, {
    rawCount: rows.length,
    incrementalCap,
    minDate,
    latestSmsDate,
  });

  const merged = dedupeSmsListItems(rows);
  await saveInboxMessagesInApiBatches(merged, {
    phase: 'incrementalFiltered',
    dedupedTotal: merged.length,
  });
}

async function syncInboxMessagesHybrid(latestSmsDate?: number): Promise<void> {
  if (latestSmsDate === undefined) {
    // First-time sync: no server SMS yet → send 200 oldest + last 6 months
    await syncFirstRunHybridInbox();
  } else {
    // Incremental sync: filter local SMS where date > latestSmsDate
    await syncIncrementalInbox(latestSmsDate);
  }
}

/**
 * Runs the inbox SMS sync pipeline independently of the native background sync.
 *
 * Why this exists:
 *   Previously, inbox SMS sync was awaited inline before `startBackGroundSyncProcess`.
 *   A slow inbox read/upload (or a thrown error) would delay/break the native
 *   `startBackGroundSyncProcess` from `react-native-collect-data`.
 *
 * Design:
 *   - Self-contained: owns its throttle checks + persist step.
 *   - Never throws: all failures are caught and logged so the caller can safely
 *     fire-and-forget this without try/catch.
 *   - Intended to be invoked WITHOUT `await`, after `startBackGroundSyncProcess`, from
 *     `executeCredeauBackgroundSync`.
 */
async function runInboxSmsSyncSafely(
  lastSmsSyncedAt: number | undefined,
  latestSmsDate: number | undefined
): Promise<void> {
  try {
    // Step 1: Check if lastSmsSyncedAt > 24hrs — if not, skip
    if (shouldSkipInboxDueToServerWatermark(lastSmsSyncedAt)) {
      console.log(`${CREDEAU_LOG_TAG} Skipping inbox SMS sync`, {
        skipReason: 'serverWatermarkWithin24h',
        lastSmsSyncedAt,
      });
      return;
    }

    if (lastSmsSyncedAt === undefined && !(await shouldAllowLocalInboxInterval())) {
      console.log(`${CREDEAU_LOG_TAG} Skipping inbox SMS sync`, {
        skipReason: 'localIntervalWithin24h',
        note: 'No server lastSmsSyncedAt yet — local throttle only',
      });
      return;
    }

    // Step 2-4: Sync SMS in batches with isFinal flag
    // If latestSmsDate is undefined → first-time sync
    // Otherwise → incremental sync (filter where date > latestSmsDate)
    await syncInboxMessagesHybrid(latestSmsDate);
    await persistLastLocalInboxSmsSyncAt();
    console.log(`${CREDEAU_LOG_TAG} Inbox SMS pipeline finished`, {
      mode: latestSmsDate === undefined ? 'firstRunHybrid' : 'incrementalFiltered',
      latestSmsDate,
    });
  } catch (error) {
    // Swallow errors here — inbox sync must not affect native background sync.
    logNonFatalError('credeau.inboxSmsSync', error);
  }
}

/**
 * Starts native background sync process on supported devices.
 *
 * Flow:
 * 1. `startBackGroundSyncProcess` (react-native-collect-data) — awaited first so native
 *    sync is not competing with our JS-side inbox work.
 * 2. Inbox SMS pipeline (`runInboxSmsSyncSafely`) — fire-and-forget after native start;
 *    same throttle + hybrid/incremental upload as before (see that helper for steps).
 *
 * @param userId - User id for Credeau username
 * @param options.lastSmsSyncedAt - Server watermark timestamp (used for 24h throttle check)
 * @param options.latestSmsDate - Most recent SMS date on server (used for filtering local SMS)
 */
export async function executeCredeauBackgroundSync(
  userId: string,
  options?: CredeauBackgroundSyncOptions
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  if (!userId || userId.trim().length === 0) {
    return;
  }

  const phoneNumber = await resolveLogPoolPhoneNumber();

  try {
    console.log(`${CREDEAU_LOG_TAG} Starting Credeau background sync`, {
      hasLastSmsSyncedAt: options?.lastSmsSyncedAt !== undefined,
      hasLatestSmsDate: options?.latestSmsDate !== undefined,
    });

    const lastSmsSyncedAt = options?.lastSmsSyncedAt;
    const latestSmsDate = options?.latestSmsDate;

    const credeauClientName = getCredeauClientName();
    const credeauClientKey = getCredeauClientKey();
    const credeauServerUrl = getCredeauServerUrl();
    const backgroundSyncIntervalSeconds = getBackgroundSyncIntervalSeconds();
    console.log(`${CREDEAU_LOG_TAG} Native Credeau config`, { credeauClientName });

    if (phoneNumber) {
      logPool.push(logPoolMessages.credeauSyncStarted(phoneNumber));
    }
    await startBackGroundSyncProcess(
      userId.trim(),
      credeauClientName,
      credeauClientKey,
      credeauServerUrl,
      backgroundSyncIntervalSeconds
    );
    console.log(`${CREDEAU_LOG_TAG} Credeau background sync started successfully`);

    if (phoneNumber) {
      logPool.push(logPoolMessages.credeauSyncFinished(phoneNumber));
    }

    // Fire-and-forget after native start: inbox SMS read/upload must not run ahead of
    // `startBackGroundSyncProcess` (avoids competing with the Credeau SDK on startup).
    // `runInboxSmsSyncSafely` swallows its own errors — do NOT await.
    void runInboxSmsSyncSafely(lastSmsSyncedAt, latestSmsDate);
  } catch (error) {
    console.log(`${CREDEAU_LOG_TAG} Error executing Credeau background sync:`, error);
    if (phoneNumber) {
      logPool.push(
        logPoolMessages.credeauSyncError(phoneNumber, formatLogPoolUnknownError(error))
      );
    }
  }
}

/**
 * Starts background sync only when permission cache is available.
 * Fetches user personal details to get phone number for Credeau username.
 *
 * Flow:
 * 1. GET personalDetails → check `lastSmsSyncedAt > 24hrs` and get `latestSmsDate`
 * 2. Filter local SMS where `date > latestSmsDate`
 * 3. POST save-user-sms `{ smsArray, isFinal: false }` × N-1 batches
 * 4. POST save-user-sms `{ smsArray, isFinal: true }` → last batch
 *
 * If `lastSmsSyncedAt` is null → send 200 oldest + last 6 months SMS in batches
 */
export async function executeCredeauSyncOnAppOpen(): Promise<void> {
  const hasGrantedPermission = await checkCredeauPermissionGranted();
  if (!hasGrantedPermission) {
    return;
  }

  // Prevent starting Credeau sync (and indirectly prompting READ_SMS) unless SMS is
  // already granted (or SMS is bypassed by app-config).
  const smsReady = await isSmsPermissionGrantedOrBypassed();
  if (!smsReady) {
    console.log(`${CREDEAU_LOG_TAG} SMS permission not granted or bypassed - skipping Credeau sync`);
    return;
  }

  // Step 1: GET personalDetails → get lastSmsSyncedAt and latestSmsDate
  const personalDetails = await fetchAndStoreUserPersonalDetails({ forceRefresh: true });

  if (!personalDetails?.userId) {
    return;
  }

  if (personalDetails.phoneNumber?.trim()) {
    void persistLogPoolPhoneNumber(personalDetails.phoneNumber);
  }

  const lastSmsSyncedAt = parseLastSmsSyncedAt(personalDetails.lastSmsSyncedAt);
  const latestSmsDate = parseLastSmsSyncedAt(personalDetails.latestSmsDate);

  console.log(`${CREDEAU_LOG_TAG} Personal details SMS fields`, {
    lastSmsSyncedAt,
    latestSmsDate,
    hasLastSmsSyncedAt: lastSmsSyncedAt !== undefined,
    hasLatestSmsDate: latestSmsDate !== undefined,
  });

  await executeCredeauBackgroundSync(personalDetails.userId, {
    lastSmsSyncedAt,
    latestSmsDate,
  });
}
