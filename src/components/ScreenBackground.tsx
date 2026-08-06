import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface ScreenBackgroundProps {
  children: ReactNode;
}

export function ScreenBackground({ children }: ScreenBackgroundProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          '#FEC530',
          'rgba(254, 197, 48, 0.12)',
          'rgba(254, 197, 48, 0.03)',
          '#FFFFFF',
        ]}
        locations={[0, 0.18, 0.36, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
