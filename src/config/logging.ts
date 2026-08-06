/** Flush pooled logs to the server every 2 minutes (also flushed on app background). */
export const LOG_POOL_FLUSH_INTERVAL_MS = 120_000;

/** Max entries kept in memory / AsyncStorage before dropping oldest. */
export const LOG_POOL_MAX_SIZE = 500;

/** Debounce AsyncStorage writes after rapid pushes. */
export const LOG_POOL_PERSIST_DEBOUNCE_MS = 300;
