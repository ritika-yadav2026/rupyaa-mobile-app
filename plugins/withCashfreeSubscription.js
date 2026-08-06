const { createRunOncePlugin, withAndroidManifest } = require("@expo/config-plugins");

function withCashfreeSubscription(config) {
  return withAndroidManifest(config, (configMod) => {
    const manifest = configMod.modResults.manifest;
    const application = manifest?.application?.[0];

    if (!application) return config;

    // Ensure tools namespace exists if we use tools:replace
    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] =
      manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";

    application["meta-data"] = application["meta-data"] || [];

    const metaName = "cashfree_subscription_flow_enable";
    const existing = application["meta-data"].find(
      (item) => item?.$?.["android:name"] === metaName
    );

    if (existing) {
      existing.$["android:value"] = "true";
      // optional: keep tools:replace consistent
      existing.$["tools:replace"] = existing.$["tools:replace"] || "android:value";
    } else {
      application["meta-data"].push({
        $: {
          "android:name": metaName,
          "android:value": "true",
          "tools:replace": "android:value",
        },
      });
    }

    return configMod;
  });
}

module.exports = createRunOncePlugin(
  withCashfreeSubscription,
  "with-cashfree-subscription",
  "1.0.0"
);