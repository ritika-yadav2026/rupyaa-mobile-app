import { devConfig } from '@/src/config/dev';

/**
 * Dev-only logging utilities for form data and registration state.
 * Controlled by devConfig.enableDebugLogs flag.
 */

/** Registration step names for tracking */
export type RegistrationStep =
  | 'mobile-verification'
  | 'otp-verification'
  | 'personal-details'
  | 'email-otp'
  | 'employment-type'
  | 'salaried-details'
  | 'self-employed-details'
  | 'unemployed-details'
  | 'work-email-otp';

const API_LOG_ONCE_KEYS = new Set<string>();
const REDACTED_VALUE = '[REDACTED]';
const REDACT_KEYS = [
  'password',
  'passcode',
  'otp',
  'token',
  'pan',
  'aadhaar',
  'aadhar',
  'email',
  'phone',
  'mobile',
  'account',
  'ifsc',
  'upi',
  'address',
  'dob',
  'dateofbirth',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const shouldRedactKey = (key: string) =>
  REDACT_KEYS.some((pattern) => key.toLowerCase().includes(pattern));

const sanitizeApiPayload = (value: unknown, depth = 0): unknown => {
  if (depth > 4) return '[TRUNCATED]';
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeApiPayload(item, depth + 1));
  }
  if (isRecord(value)) {
    const sanitized: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, entryValue]) => {
      if (shouldRedactKey(key)) {
        sanitized[key] = REDACTED_VALUE;
      } else {
        sanitized[key] = sanitizeApiPayload(entryValue, depth + 1);
      }
    });
    return sanitized;
  }
  return value;
};

export const devLog = {
  /** Log form data submission */
  formData: (step: string, data: unknown) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n📋 [${step}] Form Data:`);
    console.log(JSON.stringify(data, null, 2));
  },

  /** Log current registration state */
  registrationState: (data: unknown) => {
    if (!devConfig.enableDebugLogs) return;
    console.log('\n📦 Registration State:');
    console.log(JSON.stringify(data, null, 2));
  },

  /** Log when user enters a registration screen */
  screenEnter: (screen: RegistrationStep, extraInfo?: Record<string, unknown>) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n🚀 [SCREEN] Entered: ${screen}`);
    if (extraInfo) {
      console.log('   Context:', JSON.stringify(extraInfo, null, 2));
    }
  },

  /** Log when user leaves a registration screen */
  screenLeave: (screen: RegistrationStep, reason?: string) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n👋 [SCREEN] Left: ${screen}${reason ? ` (${reason})` : ''}`);
  },

  /** Log navigation between screens */
  navigation: (from: string, to: string) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n➡️  [NAV] ${from} → ${to}`);
  },

  /** Log when a substep is passed/completed */
  stepPassed: (phase: string, substepIndex: number, substepId: string, substepLabel: string) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n✅ [STEP PASSED] Phase: ${phase} | Substep ${substepIndex}: ${substepLabel} (${substepId})`);
  },

  /** Log when an entire phase is passed/completed */
  phasePassed: (phase: string, phaseLabel: string) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n🎉 [PHASE PASSED] ${phaseLabel} (${phase})`);
  },

  /** Log flow state changes */
  flowState: (state: {
    phaseIndex: number;
    substepIndex: number;
    phase: string;
    substepId?: string;
    passedSubsteps?: Record<string, boolean>;
    passedPhases?: Record<string, boolean>;
    userStage?: string;
    componentName?: string;
  }) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n📊 [FLOW STATE] Phase: ${state.phase} (${state.phaseIndex}) | Substep: ${state.substepIndex}${state.substepId ? ` (${state.substepId})` : ''}`);
    if (state.componentName) {
      console.log(`   Component: ${state.componentName}`);
    }
    if (state.userStage) {
      console.log(`   Backend User Stage: ${state.userStage}`);
    }
    if (state.passedSubsteps) {
      const passedCount = Object.values(state.passedSubsteps).filter(Boolean).length;
      console.log(`   Passed substeps: ${passedCount}`);
    }
    if (state.passedPhases) {
      const passedPhases = Object.entries(state.passedPhases)
        .filter(([, passed]) => passed)
        .map(([phase]) => phase);
      if (passedPhases.length > 0) {
        console.log(`   Passed phases: ${passedPhases.join(', ')}`);
      }
    }
  },

  /** Log API response once per request key */
  apiResponseOnce: (key: string, data: unknown) => {
    if (!devConfig.enableDebugLogs) return;
    if (API_LOG_ONCE_KEYS.has(key)) return;
    // API_LOG_ONCE_KEYS.add(key);
    // console.log(`\n[API] ${key}`);
    // console.log(JSON.stringify(sanitizeApiPayload(data), null, 2));
  },

  /** Log step transition with direction (for animation/debug). */
  transition: (from: string, to: string, direction: 'forward' | 'backward') => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n🔄 [TRANSITION] ${from} → ${to} (${direction})`);
  },

  /** Log stage sync retry attempt. */
  syncRetry: (attempt: number, maxRetries: number, delayMs: number) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n🔄 [SYNC RETRY] attempt ${attempt}/${maxRetries}, waiting ${delayMs}ms`);
  },

  /** Log stage sync failure after all retries. */
  syncError: (attempt: number, error: unknown) => {
    if (!devConfig.enableDebugLogs) return;
    console.warn(`\n⚠️ [SYNC ERROR] after ${attempt} attempt(s):`, error);
  },

  /** Log journey checkpoint (substep passed, persisted for resume). */
  checkpoint: (phase: string, substepId: string, timestamp: number) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n📍 [CHECKPOINT] ${phase}:${substepId} @ ${timestamp}`);
  },

  /** Log which message/label is shown for a step (e.g. bank-connect continue). */
  stepMessage: (stepId: string, key: string, value: string) => {
    if (!devConfig.enableDebugLogs) return;
    console.log(`\n💬 [STEP MESSAGE] ${stepId}.${key}: ${value}`);
  },

  sanitizeApiPayload,
};
