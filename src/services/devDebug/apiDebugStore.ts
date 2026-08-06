import { devConfig } from '@/src/config/dev';
import type { ApiResponse } from '@/src/types/api';

export type ApiDebugEntry = {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  status?: number;
  durationMs?: number;
  ok: boolean;
  response: ApiResponse<unknown> | unknown;
};

const MAX_ENTRIES = 25;
const apiEntries: ApiDebugEntry[] = [];

const buildId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const addApiDebugEntry = (entry: Omit<ApiDebugEntry, 'id' | 'timestamp'>) => {
  if (!devConfig.enableApiDebug) return;
  apiEntries.unshift({
    ...entry,
    id: buildId(),
    timestamp: Date.now(),
  });
  if (apiEntries.length > MAX_ENTRIES) {
    apiEntries.length = MAX_ENTRIES;
  }
};

export const getApiDebugEntries = (): ApiDebugEntry[] => apiEntries.slice();

export const clearApiDebugEntries = () => {
  if (!devConfig.enableApiDebug) return;
  apiEntries.length = 0;
};
