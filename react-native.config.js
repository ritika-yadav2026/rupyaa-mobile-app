/**
 * React Native module auto-linking configuration.
 *
 * Modules listed here with `platforms: { ios: null }` will NOT be linked
 * into the iOS native build. Their JS imports still resolve normally, so any
 * existing Platform.OS !== 'android' guards in the codebase remain the safety net.
 */
module.exports = {
  dependencies: {
    /**
     * react-native-collect-data (Credeau device-sync SDK)
     *
     * WHY excluded from iOS:
     *   - Its podspec depends on `CollectDeviceIOSData`, a private CocoaPod that is
     *     NOT available in the public CocoaPods trunk. Leaving auto-linking enabled
     *     causes `pod install` to fail on every EAS iOS build with:
     *       "[!] Unable to find a specification for `CollectDeviceIOSData`"
     *   - All JS call-sites in credeau-sync-service.ts are already guarded by
     *     `Platform.OS !== 'android'`, so the module is never invoked on iOS anyway.
     *
     * WHEN TO RE-ENABLE:
     *   If Credeau provides a private CocoaPods spec repo URL for CollectDeviceIOSData,
     *   add it as a pod source in app.config.js (via expo-build-properties extraPods or
     *   a custom Podfile hook), then remove the `ios: null` line below.
     */
    'react-native-collect-data': {
      platforms: {
        ios: null,
      },
    },
  },
};
