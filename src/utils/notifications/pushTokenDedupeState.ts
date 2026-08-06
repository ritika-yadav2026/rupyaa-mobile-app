const savingTokens: Set<string> = new Set();
let isSavingFcmToken = false;
let lastSavedFcmToken: string | null = null;

export function shouldDedupeFcmToken(token: string): boolean {
  return isSavingFcmToken || token === lastSavedFcmToken || savingTokens.has(token);
}

export function markFcmTokenSaveStarted(token: string): void {
  savingTokens.add(token);
  isSavingFcmToken = true;
}

export function markFcmTokenSaveFinished(token: string): void {
  savingTokens.delete(token);
  isSavingFcmToken = false;
}

export function markFcmTokenSaved(token: string): void {
  lastSavedFcmToken = token;
}

/** Clears in-memory dedupe after logout so the next session can register the same device token again. */
export function resetPushTokenDedupeState(): void {
  lastSavedFcmToken = null;
  savingTokens.clear();
  isSavingFcmToken = false;
}
