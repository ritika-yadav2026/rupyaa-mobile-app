/**
 * OTA Updates utility for checking and installing EAS updates
 * Uses expo-updates to manage over-the-air updates
 */

import { Alert, Platform } from 'react-native';
import { checkForUpdateAsync, fetchUpdateAsync, reloadAsync, isEmbeddedLaunch } from 'expo-updates';
import { markNextLaunchAsOtaReload } from '@/src/services/security';
import { logNonFatalError } from './nonFatalError';

/**
 * Check for available OTA updates and prompt user to install
 * Skips update check on web platform or when running in Expo Go
 */
export async function checkForUpdates(): Promise<void> {
  if (Platform.OS === 'web' || !isEmbeddedLaunch) {
    console.log('Update checking skipped - not supported in current environment');
    return;
  }
  try {
    const update = await checkForUpdateAsync();
    if (update.isAvailable) {
      Alert.alert(
        'Update Available',
        'An update is available. Do you want to install it now?',
        [
          {
            text: 'Update',
            onPress: async () => {
              try {
                await fetchUpdateAsync();
                // reloadAsync() restarts the JS VM but not the native process,
                // so the next boot must skip re-starting the native freeRASP SDK.
                await markNextLaunchAsOtaReload();
                await reloadAsync();
              } catch (error) {
                logNonFatalError('ota.installUpdate', error);
                console.error('Error installing update:', error);
              }
            },
          },
        ]
      );
    }
  } catch (error) {
    logNonFatalError('ota.checkForUpdates', error);
    console.error('Error checking for updates:', error);
  }
}

