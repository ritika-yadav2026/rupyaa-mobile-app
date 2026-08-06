/**
 * Re-exports API encryption from crypto. Use when getEnableEncryption() is true.
 * Single implementation lives in crypto.ts (getEncryptionSecret + encryptApiPayload / decryptApiPayload).
 */
export {
  decryptGeneric as decryptGenericWeb,
  decryptResponse,
  encryptGeneric,
  encryptPayload,
} from '@/src/utils/crypto';
