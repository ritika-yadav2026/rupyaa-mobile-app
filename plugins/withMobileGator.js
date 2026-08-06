// plugins/with-mobilegator.js
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withAppBuildGradle,
} = require("@expo/config-plugins");

const INDIA_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.READ_PHONE_STATE",
  "android.permission.ACCESS_WIFI_STATE",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.READ_SMS",
  "android.permission.ACCESS_COARSE_LOCATION",
];

const GLOBAL_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.READ_CALL_LOG",
  "android.permission.READ_CONTACTS",
  "android.permission.READ_PHONE_STATE",
  "android.permission.ACCESS_WIFI_STATE",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.RECEIVE_SMS",
  "android.permission.READ_SMS",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
];

const DEFAULTS = {
  market: "india",      // "india" | "global" | "other"
  allowBackup: false,   // recommended false for lending apps
  enableDesugaring: true,
};

function addUniqueItem(items, name, extraAttrs = {}) {
  const existing = items.find((item) => item?.$?.["android:name"] === name);
  if (existing) {
    existing.$ = { ...existing.$, ...extraAttrs };
    return;
  }
  items.push({ $: { "android:name": name, ...extraAttrs } });
}

function setOrAppendToolsReplace(existing, key) {
  const parts = String(existing || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.includes(key)) parts.push(key);
  return parts.join(",");
}

/**
 * Ensures core library desugaring is enabled AND dependency is present.
 * Fixes build error:
 *  "coreLibraryDesugaring configuration contains no dependencies"
 */
function ensureDesugaringSetup(contents) {
  // 1) Enable in compileOptions (only if not present)
  if (!contents.includes("coreLibraryDesugaringEnabled")) {
    contents = contents.replace(
      /android\s*\{\s*\n/,
      (m) =>
        `${m}    compileOptions {\n` +
        `        sourceCompatibility JavaVersion.VERSION_1_8\n` +
        `        targetCompatibility JavaVersion.VERSION_1_8\n` +
        `        coreLibraryDesugaringEnabled true\n` +
        `    }\n`
    );
  }

  // 2) Ensure dependency exists (handles both coreLibraryDesugaring("x") and coreLibraryDesugaring "x")
  const hasDep =
    contents.includes("coreLibraryDesugaring(") ||
    /\bcoreLibraryDesugaring\s+["']/.test(contents);

  if (!hasDep) {
    // Inject inside the first dependencies block
    if (/dependencies\s*\{\s*\n/.test(contents)) {
      contents = contents.replace(
        /dependencies\s*\{\s*\n/,
        (m) => `${m}    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.2")\n`
      );
    } else if (/dependencies\s*\{/.test(contents)) {
      // fallback if file has no newline right after {
      contents = contents.replace(
        /dependencies\s*\{/,
        (m) => `${m}\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.2")\n`
      );
    } else {
      // Last resort: append a dependencies block (rare)
      contents +=
        `\n\ndependencies {\n` +
        `    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.2")\n` +
        `}\n`;
    }
  }

  return contents;
}

function ensureRepoBlock(contents, repoBlock) {
  // Avoid duplicating if already present
  if (contents.includes('url "s3://deviceinsightssdk"') || contents.includes("s3://deviceinsightssdk")) {
    return contents;
  }

  // Prefer to inject into existing repositories { } block if present
  if (contents.match(/repositories\s*\{/)) {
    return contents.replace(
      /repositories\s*\{\s*\n/,
      (m) => `${m}${repoBlock}\n`
    );
  }

  // Otherwise, add repositories block before dependencies block
  if (contents.match(/dependencies\s*\{/)) {
    return contents.replace(
      /dependencies\s*\{/,
      `repositories {\n${repoBlock}\n}\n\ndependencies {`
    );
  }

  // Last resort append
  return contents + `\n\nrepositories {\n${repoBlock}\n}\n`;
}

function withMobileGatorManifest(config, options) {
  return withAndroidManifest(config, (configMod) => {
    const manifest = configMod.modResults;
    const androidManifest = manifest?.manifest;
    if (!androidManifest) {
      return configMod;
    }

    androidManifest["uses-permission"] = androidManifest["uses-permission"] || [];
    androidManifest["uses-feature"] = androidManifest["uses-feature"] || [];

    // Ensures xmlns:tools exists on <manifest>
    AndroidConfig.Manifest.ensureToolsAvailable(manifest);

    const market = String(options.market || DEFAULTS.market).toLowerCase();
    const permissions =
      market === "global" || market === "other" ? GLOBAL_PERMISSIONS : INDIA_PERMISSIONS;

    // Extra protected permission only for global/other
    if (market === "global" || market === "other") {
      addUniqueItem(
        androidManifest["uses-permission"],
        "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
        { "tools:ignore": "ProtectedPermissions" }
      );
    }

    permissions.forEach((p) => addUniqueItem(androidManifest["uses-permission"], p));

    // Telephony optional (so tablets/no-sim devices don't break installs)
    addUniqueItem(androidManifest["uses-feature"], "android.hardware.telephony", {
      "android:required": "false",
    });

    // Fix manifest merge conflict for allowBackup (your error)
    const application = androidManifest.application?.[0];
    if (application) {
      application.$ = application.$ || {};
      application.$["android:allowBackup"] = options.allowBackup ? "true" : "false";
      application.$["tools:replace"] = setOrAppendToolsReplace(
        application.$["tools:replace"],
        "android:allowBackup"
      );
    }

    return configMod;
  });
}

function withMobileGatorBuildGradle(config, options) {
  return withAppBuildGradle(config, (configMod) => {
    // ✅ Security: don't hardcode keys into Gradle.
    // Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in EAS Secrets / CI env.
    const repoBlock =
      `    maven {\n` +
      `        url "s3://deviceinsightssdk"\n` +
      `        credentials(AwsCredentials) {\n` +
      `            accessKey = System.getenv("AWS_ACCESS_KEY_ID") ?: System.getenv("MOBILEGATOR_AWS_ACCESS_KEY")\n` +
      `            secretKey = System.getenv("AWS_SECRET_ACCESS_KEY") ?: System.getenv("MOBILEGATOR_AWS_SECRET_KEY")\n` +
      `        }\n` +
      `    }`;

    let contents = configMod.modResults.contents;

    contents = ensureRepoBlock(contents, repoBlock);

    if (options.enableDesugaring) {
      contents = ensureDesugaringSetup(contents);
    }

    configMod.modResults.contents = contents;
    return configMod;
  });
}

const withMobileGator = (config, options = {}) => {
  const resolved = { ...DEFAULTS, ...options };
  let next = config;
  next = withMobileGatorManifest(next, resolved);
  next = withMobileGatorBuildGradle(next, resolved);
  return next;
};

module.exports = createRunOncePlugin(withMobileGator, "with-mobilegator", "1.0.1");
