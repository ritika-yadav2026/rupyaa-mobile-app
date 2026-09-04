import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme';

export interface ScreenBackgroundProps {
  children: ReactNode;
}

export function ScreenBackground({ children }: ScreenBackgroundProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          colors.primary.main,
          'rgba(254, 202, 66, 0.12)',
          'rgba(254, 202, 66, 0.03)',
          colors.background.primary,
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
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
});
