/**
 * Development and Debug Configuration
 * 
 * Centralized configuration for development features, debugging, and logging.
 * These flags can be toggled independently of the build environment.
 */

export const devConfig = {
  /**
   * Enable debug logging throughout the app.
   * When true, console.log/warn/error statements will execute.
   * Set to false to disable all debug logs in production.
   */
  enableDebugLogs: __DEV__,

  /**
   * Enable API debug logging and tracking.
   * When true, API requests/responses will be logged and tracked in debug store.
   */
  enableApiDebug: __DEV__,
};
