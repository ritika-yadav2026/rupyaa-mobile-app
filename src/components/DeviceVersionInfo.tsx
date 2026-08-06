import React, { useSyncExternalStore } from 'react';
import Constants from 'expo-constants';
import { nativeBuildVersion } from 'expo-application';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { AppText } from './AppText';
import {
  getCurrentApiBaseUrl,
  subscribeToApiBaseUrl,
} from '@/src/services/devToggles/apiBaseUrlResolver';

const DeviceVersionInfo = () => {
  const isDevelopment = Constants?.expoConfig?.extra?.isDevelopment;
  const apiBaseUrl = useSyncExternalStore(
    subscribeToApiBaseUrl,
    getCurrentApiBaseUrl,
    getCurrentApiBaseUrl,
  );

  // Fetch app version and build number
  const buildNumber = nativeBuildVersion;
  const otaUpdateNumber = Constants?.expoConfig?.extra?.otaUpdateNumber; // Taken from app.json after eas update

  // Taken from app.json after eas update
  const runTimeVersion = Constants.expoConfig?.version;

  const renderVersionInfo = () => {
    return `App version ${runTimeVersion}`;
  };

  const renderOTPUpdateInfo = () => {
    return `v${buildNumber} - ${otaUpdateNumber} ${isDevelopment ? 'dev' : ''}`;
  };

  return (
    <View style={styles.infoContainer}>
      <AppText style={styles.info}>{renderVersionInfo()}</AppText>
      <AppText style={styles.info}>{renderOTPUpdateInfo()}</AppText>
      {isDevelopment && <AppText style={styles.info}>{apiBaseUrl}</AppText>}
    </View>
  );
};

export default DeviceVersionInfo;

const styles = StyleSheet.create({
  infoContainer: {
    rowGap: 5,
    marginBottom: 12,
  },
  info: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text.secondary,
  },
});
