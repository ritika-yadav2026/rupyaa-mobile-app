/** Dev-only console logger — kept in a leaf module to avoid config import cycles. */
export const consoleLogDev = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log(...args);
  }
};
