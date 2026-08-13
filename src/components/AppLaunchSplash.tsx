import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RupyaaLogo } from './RupyaaLogo';
import { colors } from '@/src/theme';

export function AppLaunchSplash() {
  return (
    <View style={styles.container} accessibilityLabel="Rupyaa is starting">
      <LinearGradient
        colors={[colors.primary.main, colors.background.primary, colors.primary.main]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <RupyaaLogo size="lg" style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
  },
  logo: {
    alignSelf: 'center',
  },
});
