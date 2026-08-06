import { useEffect } from 'react';
import { executeCredeauSyncOnAppOpen } from '@/src/services/credeau/credeau-sync-service';

export function useCredeauSync(): void {
  useEffect(() => {
    // Trigger sync at app startup only when permissions were granted earlier.
    void executeCredeauSyncOnAppOpen();
  }, []);
}
