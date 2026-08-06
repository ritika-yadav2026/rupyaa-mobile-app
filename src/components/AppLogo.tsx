import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { router } from 'expo-router';
import { goHomeWithFallback } from '@/src/services/navigation/homeNavigation';
import { RupyaaLogo } from './RupyaaLogo';

export interface AppLogoProps {
  /** Optional container style override */
  style?: ViewStyle;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function AppLogo({ style, size = 'sm', disabled = false }: AppLogoProps) {
  const handlePress = () => {
    if (disabled) return;
    goHomeWithFallback(router);
  }

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={handlePress}>
        <RupyaaLogo size={size} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
