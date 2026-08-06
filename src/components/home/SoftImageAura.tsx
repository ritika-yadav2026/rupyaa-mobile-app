import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme';

interface SoftImageAuraProps {
  style?: StyleProp<ViewStyle>;
}

const CARD_BG = colors.background.primary;

/**
 * Aura with no visible edge: horizontal green tint that fades at left/right,
 * and a vertical fade so it also blends at top/bottom into the card background.
 */
export function SoftImageAura({ style }: SoftImageAuraProps) {
  return (
    <View style={[styles.base, style]} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(0,101,37,0)',
          'rgba(0,101,37,0.03)',
          'rgba(0,101,37,0.08)',
          'rgba(0,101,37,0.14)',
          'rgba(0,101,37,0.09)',
          'rgba(0,101,37,0.03)',
          'rgba(0,101,37,0)',
        ]}
        locations={[0, 0.18, 0.38, 0.58, 0.74, 0.9, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Vertical fade so top/bottom blend into card — no visible edge */}
      <LinearGradient
        colors={[CARD_BG, 'transparent', 'transparent', CARD_BG]}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
