import { useFlowStore } from '@/src/store/useFlowStore';

/**
 * Resolves the post-auth route for initial app load.
 * Product decision: always land users on Home first.
 */
export async function resolveFlowRoute(): Promise<string> {
  const persistApi = (useFlowStore as unknown as { persist?: { rehydrate: () => Promise<void> } })
    .persist;
  if (persistApi?.rehydrate) {
    await persistApi.rehydrate();
  }
  return '/(tabs)/home';
}
