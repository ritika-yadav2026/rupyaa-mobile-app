import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const SHAKE_OFFSET = 10;
const SHAKE_STEP_MS = 50;

/**
 * Returns an animated style and a trigger function for a horizontal shake.
 * Apply shakeStyle to an Animated.View; call triggerShake() to run the animation.
 */
export function useShakeAnimation(): {
  shakeStyle: ReturnType<typeof useAnimatedStyle>;
  triggerShake: () => void;
} {
  const translateX = useSharedValue(0);

  const triggerShake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(SHAKE_OFFSET, { duration: SHAKE_STEP_MS }),
      withTiming(-SHAKE_OFFSET, { duration: SHAKE_STEP_MS }),
      withTiming(SHAKE_OFFSET, { duration: SHAKE_STEP_MS }),
      withTiming(-SHAKE_OFFSET, { duration: SHAKE_STEP_MS }),
      withTiming(0, { duration: SHAKE_STEP_MS })
    );
  }, [translateX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { shakeStyle, triggerShake };
}
