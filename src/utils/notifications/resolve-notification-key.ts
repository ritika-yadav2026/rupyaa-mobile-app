/**
 * Derive a stable notification key using message identifiers or sent timestamp.
 */
export default function resolveNotificationKey(messageId: unknown, sentTime: unknown): string | null {
  if (typeof messageId === 'string' && messageId.length > 0) {
    return messageId;
  }
  if (typeof messageId === 'number') {
    return String(messageId);
  }
  if (typeof sentTime === 'number' && Number.isFinite(sentTime)) {
    return String(sentTime);
  }
  if (typeof sentTime === 'string' && sentTime.length > 0) {
    return sentTime;
  }
  return null;
}

