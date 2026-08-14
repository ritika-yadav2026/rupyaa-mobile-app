/**
 * Pre-OTA guard: with EXPO_NO_DOTENV=1, Metro does not read `.env` / `.env.local`.
 * This script ensures the chosen OTA env file defines every variable the app and
 * app.config read at bundle time, and that Expo's loader is actually disabled when
 * EXPO_NO_DOTENV is set.
 *
 * Keep `REQUIRED_EXPO_PUBLIC_KEYS` in sync with:
 * - src/config/envConfig.ts
 * - app.config.js (EXPO_PUBLIC_APP_ENV, APP_ENV optional)
 * - updateversion.js
 *
 * Usage:
 *   node scripts/verify-ota-env.js --file .env.preview --expect-app-env development
 *   node scripts/verify-ota-env.js --file .env.production --expect-app-env production
 *   node scripts/verify-ota-env.js --all
 */

const fs = require('fs');
const path = require('path');

/** Must be present and non-empty in the OTA env file (bundle-time inlining). */
const REQUIRED_EXPO_PUBLIC_KEYS = [
  'EXPO_PUBLIC_APP_ENV',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_ADJUST_APP_TOKEN',
  'EXPO_PUBLIC_FB_APP_ID',
  // 'EXPO_PUBLIC_SSL_PINNING_ENABLED',
];

const ROOT = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Env file not found: ${abs}`);
  }
  const raw = fs.readFileSync(abs, 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return { abs, env: out };
}

function hasEncryptionSecret(env) {
  const main = (env.EXPO_PUBLIC_API_ENCRYPTION_SECRET ?? '').trim();
  const test = (env.EXPO_PUBLIC_TEST_ENCRYPTION_SECRET ?? '').trim();
  return Boolean(main || test);
}

/** Short token mask for logs (never print full secrets). */
function maskSecret(value) {
  const s = String(value ?? '').trim();
  if (!s) return '(empty)';
  if (s.length <= 4) return '****';
  return `${s.slice(0, 2)}…${s.slice(-2)} (${s.length} chars)`;
}

function describeEncryption(env) {
  const main = (env.EXPO_PUBLIC_API_ENCRYPTION_SECRET ?? '').trim();
  const test = (env.EXPO_PUBLIC_TEST_ENCRYPTION_SECRET ?? '').trim();
  if (main && test) return 'API + TEST keys set';
  if (main) return 'EXPO_PUBLIC_API_ENCRYPTION_SECRET set';
  if (test) return 'EXPO_PUBLIC_TEST_ENCRYPTION_SECRET set';
  return '(none)';
}

/**
 * Log non-sensitive / low-sensitivity bundle-time values for operator clarity.
 * Tokens and encryption values are masked or omitted.
 */
function logOtaEnvSummary(env, relPath) {
  const ngrok = (env.EXPO_PUBLIC_NGROK_API_URL ?? '').trim();
  console.log(`[verify-ota-env] Summary for ${relPath}:`);
  console.log(`  EXPO_PUBLIC_APP_ENV             = ${env.EXPO_PUBLIC_APP_ENV ?? '(missing)'}`);
  console.log(`  EXPO_PUBLIC_API_URL             = ${env.EXPO_PUBLIC_API_URL ?? '(missing)'}`);
  console.log(
    `  EXPO_PUBLIC_NGROK_API_URL       = ${ngrok || '(empty)'}`,
  );
  console.log(`  EXPO_PUBLIC_ADJUST_APP_TOKEN    = ${maskSecret(env.EXPO_PUBLIC_ADJUST_APP_TOKEN)}`);
  console.log(`  EXPO_PUBLIC_FB_APP_ID           = ${env.EXPO_PUBLIC_FB_APP_ID ?? '(missing)'}`);
  console.log(`  EXPO_PUBLIC_SSL_PINNING_ENABLED = ${env.EXPO_PUBLIC_SSL_PINNING_ENABLED ?? '(missing)'}`);
  console.log(`  encryption                      = ${describeEncryption(env)}`);
}

function collectExpoPublicKeysFromLocalDotenv() {
  const abs = path.join(ROOT, '.env');
  if (!fs.existsSync(abs)) {
    return [];
  }
  const { env } = parseEnvFile(abs);
  return Object.keys(env).filter((k) => k.startsWith('EXPO_PUBLIC_'));
}

function verifyExpoNoDotenvDisablesFileList() {
  const prev = process.env.EXPO_NO_DOTENV;
  process.env.EXPO_NO_DOTENV = '1';
  try {
    const { getEnvFiles } = require('@expo/env');
    const files = getEnvFiles({ mode: 'production', silent: true });
    if (files.length !== 0) {
      throw new Error(
        `EXPO_NO_DOTENV=1 should yield no Expo env files; got: ${JSON.stringify(files)}`,
      );
    }
  } finally {
    if (prev === undefined) {
      delete process.env.EXPO_NO_DOTENV;
    } else {
      process.env.EXPO_NO_DOTENV = prev;
    }
  }
}

function verifyTargetFile(fileArg, expectAppEnv) {
  const { abs, env } = parseEnvFile(fileArg);

  const missing = [];
  for (const key of REQUIRED_EXPO_PUBLIC_KEYS) {
    if (!(key in env) || String(env[key]).trim() === '') {
      missing.push(key);
    }
  }
  if (missing.length) {
    throw new Error(
      `[verify-ota-env] ${path.relative(ROOT, abs)}: missing or empty: ${missing.join(', ')}`,
    );
  }

  if (!hasEncryptionSecret(env)) {
    throw new Error(
      `[verify-ota-env] ${path.relative(ROOT, abs)}: set EXPO_PUBLIC_API_ENCRYPTION_SECRET and/or EXPO_PUBLIC_TEST_ENCRYPTION_SECRET`,
    );
  }

  if (env.EXPO_PUBLIC_APP_ENV !== expectAppEnv) {
    throw new Error(
      `[verify-ota-env] ${path.relative(ROOT, abs)}: EXPO_PUBLIC_APP_ENV must be "${expectAppEnv}" (got "${env.EXPO_PUBLIC_APP_ENV}")`,
    );
  }

  const localKeys = collectExpoPublicKeysFromLocalDotenv();
  const skipCross =
    process.env.SKIP_OTA_ENV_LOCAL_CROSSCHECK === '1' ||
    process.env.SKIP_OTA_ENV_LOCAL_CROSSCHECK === 'true';
  if (!skipCross && localKeys.length) {
    const absent = localKeys.filter((k) => !(k in env));
    if (absent.length) {
      throw new Error(
        `[verify-ota-env] ${path.relative(ROOT, abs)}: with EXPO_NO_DOTENV, local .env keys would not merge. ` +
          `Add these EXPO_PUBLIC_* keys to this file (or move dev-only vars to .env.local): ${absent.join(', ')}`,
      );
    }
  }

  const rel = path.relative(ROOT, abs);
  logOtaEnvSummary(env, rel);
  console.log(`[verify-ota-env] OK: ${rel}`);
}

function parseArgs() {
  const argv = process.argv.slice(2);
  if (argv.includes('--all')) {
    return { mode: 'all' };
  }
  let file;
  let expectAppEnv;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file' && argv[i + 1]) {
      file = argv[i + 1];
      i++;
    } else if (argv[i] === '--expect-app-env' && argv[i + 1]) {
      expectAppEnv = argv[i + 1];
      i++;
    }
  }
  if (!file || !expectAppEnv) {
    console.error(
      'Usage: node scripts/verify-ota-env.js --file <path> --expect-app-env <development|production>\n' +
        '   or: node scripts/verify-ota-env.js --all',
    );
    process.exit(1);
  }
  return { mode: 'single', file, expectAppEnv };
}

function main() {
  verifyExpoNoDotenvDisablesFileList();

  const args = parseArgs();
  if (args.mode === 'all') {
    verifyTargetFile('.env.preview', 'development');
    verifyTargetFile('.env.production', 'production');
    console.log('[verify-ota-env] All OTA env files passed.');
    return;
  }
  verifyTargetFile(args.file, args.expectAppEnv);
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
