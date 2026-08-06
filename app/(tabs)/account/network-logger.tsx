import React from 'react';
import { StyleSheet, View } from 'react-native';
import NetworkLogger from 'react-native-network-logger';
import { colors } from '@/src/theme';

export default function NetworkLoggerPage(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <NetworkLogger theme="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
});
