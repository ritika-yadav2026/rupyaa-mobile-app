/**
 * Types for WebView postMessage payloads from the native app message bridge.
 * Message format: { type: string; timestamp: number; payload: unknown }
 */

export interface WebViewMessageBase {
  type: string;
  timestamp: number;
  payload: unknown;
}

export interface BankStatementSuccessPayload {
  params?: string;
  source?: string;
}

export interface DigilockerSuccessPayload {
  // Define based on actual Digilocker response when needed
  [key: string]: unknown;
}

export interface FaceKYCSuccessPayload {
  // Define based on actual Face KYC response when needed
  [key: string]: unknown;
}

export interface EsignSuccessPayload {
  // Define based on actual eSign response when needed
  [key: string]: unknown;
}
