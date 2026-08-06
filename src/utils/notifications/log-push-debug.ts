import { consoleLogDev } from "../common-helper";

/**
 * Log push notification debugging information with a consistent prefix.
 */
export default function logPushDebug(event: string, context: Readonly<Record<string, unknown>> = {}): void {
  consoleLogDev(`[PushDebug] ${event}`, context);
}
