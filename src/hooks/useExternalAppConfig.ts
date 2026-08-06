import { useCallback } from 'react';
import { useAppConfigStore } from '@/src/store/useAppConfigStore';
import type { ExternalAppConfigData } from '@/src/types/app-config';
import { API_ENDPOINTS } from '@/src/config/api';
import { apiClient } from '@/src/services/api/apiClient';

/**
 * Shared in-flight promise so concurrent callers (routeResolver + permissions
 * screen) await the same request instead of firing duplicates.
 */
let inflightPromise: Promise<void> | null = null;

/**
 * Standalone (non-hook) fetch for use in services like routeResolver where
 * React hooks are unavailable. Safe to call multiple times — deduplicates
 * concurrent calls and skips when already in-flight.
 */
export async function fetchAndStoreAppConfig(): Promise<void> {
  const { status } = useAppConfigStore.getState();

  // Already in-flight — await the existing request instead of starting another.
  if (status === 'loading' && inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = performFetch();
  try {
    await inflightPromise;
  } finally {
    inflightPromise = null;
  }
}

async function performFetch(): Promise<void> {
  const { setConfig, setStatus } = useAppConfigStore.getState();
  try {
    setStatus('loading');
    const response = await apiClient.get<ExternalAppConfigData>(
      API_ENDPOINTS.external.externalAppConfig,
    );
    if (response.success && response.data) {
      // consoleLogDev('[APP_CONFIG] response', response.data);
      setConfig(response.data);
    } else {
      setStatus('error');
    }
  } catch {
    setStatus('error');
  }
}

/**
 * React hook wrapper. Delegates to the shared fetchAndStoreAppConfig so
 * the duplicate-request guard is always active regardless of call site.
 */
export function useExternalAppConfig() {
  const fetchAppConfig = useCallback(() => fetchAndStoreAppConfig(), []);

  return { fetchAppConfig };
}
