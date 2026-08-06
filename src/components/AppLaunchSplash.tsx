import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RupyaaLogo } from './RupyaaLogo';
import { colors } from '@/src/theme';

const INTRO_DURATION_MS = 500;
const PULSE_DURATION_MS = 900;

export function AppLaunchSplash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.04,
          duration: PULSE_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: PULSE_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    intro.start(({ finished }) => {
      if (finished) pulse.start();
    });

    return () => {
      intro.stop();
      pulse.stop();
    };
  }, [opacity, scale]);

  return (
    <View style={styles.container} accessibilityLabel="Rupyaa is starting">
      <LinearGradient
        colors={[colors.primary.main, colors.background.primary, colors.primary.main]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <RupyaaLogo size="lg" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
});
