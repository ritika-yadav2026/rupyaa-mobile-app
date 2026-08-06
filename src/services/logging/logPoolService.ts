import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LOG_POOL_MAX_SIZE,
  LOG_POOL_PERSIST_DEBOUNCE_MS,
} from '@/src/config/logging';
import { STORAGE_KEYS } from '@/src/constants/data';
import { consoleLogDev } from '@/src/utils/consoleLogDev';
import { pushLogsToServer } from './logPoolApi';
import { withLogPoolEventTimestamp } from './logPoolMessages';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/** Old verbose lines without `{phone} ` prefix (pre–simple-string pool). */
const LEGACY_LOG_LINES_WITHOUT_PHONE = new Set([
  'Log pool initialized',
  'App startup',
  'Send OTP requested',
  'Send OTP succeeded',
  'Verify OTP requested',
  'Verify OTP succeeded',
  'Resend OTP requested',
  'Loan journey substep entered',
  'Loan journey step next',
  'Loan journey stage redirect',
  'Loan journey ineligibility shown',
  'Loan journey stage sync error',
  'Offer status modal: check offers',
]);

/** Internal / legacy lines that should never be sent to the backend. */
const isIgnoredLogLine = (line: string): boolean => {
  const normalized = line.trim();
  if (normalized.length === 0) {
    return true;
  }
  if (LEGACY_LOG_LINES_WITHOUT_PHONE.has(normalized)) {
    return true;
  }
  // Drop lines that look like old format (no leading digits = no phone prefix).
  if (!/^\d{10}\s/.test(normalized)) {
    return true;
  }
  return false;
};

const filterPoolLines = (lines: string[]): string[] =>
  lines.filter((line) => !isIgnoredLogLine(line));

/** Legacy persisted shape before logs were simplified to plain strings. */
const legacyMessageFromEntry = (value: unknown): string | undefined => {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const message = (value as { message?: unknown }).message;
  return isNonEmptyString(message) ? message.trim() : undefined;
};

const parsePersistedPool = (raw: string | null): string[] => {
  if (raw === null || raw.trim().length === 0) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const lines: string[] = [];
    parsed.forEach((item) => {
      if (isNonEmptyString(item)) {
        lines.push(item.trim());
        return;
      }
      const legacyMessage = legacyMessageFromEntry(item);
      if (legacyMessage) {
        lines.push(legacyMessage);
      }
    });
    return filterPoolLines(lines);
  } catch {
    return [];
  }
};

const trimPoolToMaxSize = (pool: string[]): string[] => {
  if (pool.length <= LOG_POOL_MAX_SIZE) {
    return pool;
  }
  return pool.slice(pool.length - LOG_POOL_MAX_SIZE);
};

class LogPoolService {
  private pool: string[] = [];
  private isFlushing = false;
  private isInitialized = false;
  private persistDebounceId: ReturnType<typeof setTimeout> | null = null;
  private flushIntervalId: ReturnType<typeof setInterval> | null = null;

  async init(flushIntervalMs: number): Promise<void> {
    if (this.isInitialized && this.flushIntervalId !== null) {
      return;
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.pendingLogs);
    const persisted = parsePersistedPool(raw);
    if (!this.isInitialized) {
      this.pool = trimPoolToMaxSize(persisted);
      this.isInitialized = true;
    } else if (persisted.length > 0) {
      this.pool = trimPoolToMaxSize(filterPoolLines([...persisted, ...this.pool]));
    }

    if (this.flushIntervalId !== null) {
      clearInterval(this.flushIntervalId);
    }
    this.flushIntervalId = setInterval(() => {
      void this.flush();
    }, flushIntervalMs);

    consoleLogDev('[logPool] initialized', {
      flushIntervalMs,
      pendingCount: this.pool.length,
    });

    await this.persistNow();
    void this.flush();
  }

  shutdown(): void {
    if (this.flushIntervalId !== null) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
    if (this.persistDebounceId !== null) {
      clearTimeout(this.persistDebounceId);
      this.persistDebounceId = null;
    }
    void this.persistNow();
    this.isInitialized = false;
  }

  push(line: string): void {
    const message = withLogPoolEventTimestamp(line?.trim() ?? '');
    if (!message || isIgnoredLogLine(message)) {
      return;
    }

    this.pool.push(message);
    this.pool = trimPoolToMaxSize(this.pool);
    this.schedulePersist();

    consoleLogDev('[logPool] pushed', {
      line: message,
      pendingCount: this.pool.length,
    });
  }

  getPendingCount(): number {
    return this.pool.length;
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.pool.length === 0) {
      return;
    }

    this.isFlushing = true;
    const batch = [...this.pool];

    try {
      const result = await pushLogsToServer(batch);
      if (!result.success) {
        consoleLogDev('[logPool] flush failed', {
          pendingCount: this.pool.length,
          batchSize: batch.length,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          status: result.status,
        });
        return;
      }

      this.pool = this.pool.slice(batch.length);
      await this.persistNow();
      consoleLogDev('[logPool] flush success', {
        batchSize: batch.length,
        remaining: this.pool.length,
        logs: batch,
      });
    } catch {
      consoleLogDev('[logPool] flush failed', {
        pendingCount: this.pool.length,
        batchSize: batch.length,
        errorCode: 'LOG_BATCH_FLUSH_EXCEPTION',
      });
    } finally {
      this.isFlushing = false;
    }
  }

  private schedulePersist(): void {
    if (this.persistDebounceId !== null) {
      clearTimeout(this.persistDebounceId);
    }
    this.persistDebounceId = setTimeout(() => {
      this.persistDebounceId = null;
      void this.persistNow();
    }, LOG_POOL_PERSIST_DEBOUNCE_MS);
  }

  private async persistNow(): Promise<void> {
    try {
      if (this.pool.length === 0) {
        await AsyncStorage.removeItem(STORAGE_KEYS.pendingLogs);
        return;
      }
      await AsyncStorage.setItem(
        STORAGE_KEYS.pendingLogs,
        JSON.stringify(this.pool)
      );
    } catch {
      // Non-fatal: in-memory pool still holds entries for next flush.
    }
  }
}

export const logPool = new LogPoolService();
