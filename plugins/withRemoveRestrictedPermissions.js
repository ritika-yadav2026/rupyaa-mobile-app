const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

// Permissions banned by Google Play Personal Loans policy (or not needed by the app).
// ACCESS_COARSE_LOCATION is NOT banned and is intentionally kept.
const BANNED_PERMISSIONS = [
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.RECORD_AUDIO',
  // Play policy: freeRASP screen-capture detection permissions cause rejection.
  'android.permission.DETECT_SCREEN_CAPTURE',
  'android.permission.DETECT_SCREEN_RECORDING',
];

/**
 * Strips banned permissions from AndroidManifest so the app complies with
 * Google Play Personal Loans policy. Must run as the last plugin so it
 * removes permissions added by expo-location, expo-document-picker, expo-camera, etc.
 */
function withRemoveRestrictedPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Required so tools:node works in manifest merge.
    AndroidConfig.Manifest.ensureToolsAvailable(cfg.modResults);

    // Remove banned permissions from all known permission lists.
    const permissionNodeKeys = [
      'uses-permission',
      'uses-permission-sdk-23',
      'uses-permission-sdk-m',
    ];

    permissionNodeKeys.forEach((nodeKey) => {
      const nodes = manifest[nodeKey] ?? [];
      manifest[nodeKey] = nodes.filter(
        (permissionNode) =>
          !BANNED_PERMISSIONS.includes(permissionNode?.$?.['android:name'])
      );
    });

    // Add explicit remove directives to stop dependency manifests from
    // re-introducing banned permissions during Gradle manifest merge.
    const usesPermissions = manifest['uses-permission'] ?? [];
    BANNED_PERMISSIONS.forEach((permissionName) => {
      const existingNode = usesPermissions.find(
        (permissionNode) => permissionNode?.$?.['android:name'] === permissionName
      );

      if (existingNode) {
        existingNode.$ = {
          ...existingNode.$,
          'tools:node': 'remove',
        };
        return;
      }

      usesPermissions.push({
        $: {
          'android:name': permissionName,
          'tools:node': 'remove',
        },
      });
    });

    manifest['uses-permission'] = usesPermissions;
    return cfg;
  });
}

module.exports = withRemoveRestrictedPermissions;
