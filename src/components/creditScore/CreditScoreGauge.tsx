import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '@/src/components/AppText';
import { colors } from '@/src/theme';
import { getCreditScorePresentation } from '@/src/config/creditScore';

interface CreditScoreGaugeProps { score: number; compact?: boolean }

const MIN_SCORE = 300;
const MAX_SCORE = 900;
const GAUGE_ANIMATION_DURATION_MS = 1400;
const ARC_STROKE_WIDTH = 12;
const INDICATOR_RADIUS = 7;
const ARC_INSET = 18;

export function CreditScoreGauge({ score, compact = false }: CreditScoreGaugeProps) {
  const boundedScore = Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
  const animation = useRef(new Animated.Value(MIN_SCORE)).current;
  const [displayedScore, setDisplayedScore] = useState(MIN_SCORE);

  useEffect(() => {
    const listenerId = animation.addListener(({ value }) => {
      setDisplayedScore(Math.round(value));
    });
    return () => animation.removeListener(listenerId);
  }, [animation]);

  useEffect(() => {
    animation.stopAnimation();
    animation.setValue(MIN_SCORE);
    setDisplayedScore(MIN_SCORE);

    const gaugeAnimation = Animated.timing(animation, {
      toValue: boundedScore,
      duration: GAUGE_ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    gaugeAnimation.start(({ finished }) => {
      if (finished) setDisplayedScore(boundedScore);
    });
    return () => gaugeAnimation.stop();
  }, [animation, boundedScore]);

  const progress = Math.min(
    1,
    Math.max(0, (displayedScore - MIN_SCORE) / (MAX_SCORE - MIN_SCORE))
  );
  const presentation = getCreditScorePresentation(displayedScore);
  const width = compact ? 210 : 250;
  const radius = width / 2 - ARC_INSET;
  const length = Math.PI * radius;
  const angle = Math.PI * (1 - progress);
  const markerX = width / 2 + radius * Math.cos(angle);
  const markerY = width / 2 - radius * Math.sin(angle);
  const arcPath = `M ${ARC_INSET} ${width / 2} A ${radius} ${radius} 0 0 1 ${width - ARC_INSET} ${width / 2}`;
  return (
    <View style={[styles.container, { width, height: compact ? 125 : 145 }]}>
      <Svg width={width} height={width / 2 + 20} viewBox={`0 0 ${width} ${width / 2 + 20}`}>
        <Defs>
          <LinearGradient id="mainGaugeGradient" x1={ARC_INSET} y1="0" x2={width - ARC_INSET} y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#12B967" />
            <Stop offset="0.42" stopColor="#E7B52D" />
            <Stop offset="0.7" stopColor="#F37A2C" />
            <Stop offset="1" stopColor="#EF4C42" />
          </LinearGradient>
          <LinearGradient id="compactGaugeGradient" x1={ARC_INSET} y1="0" x2={width - ARC_INSET} y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#EF4C42" />
            <Stop offset="0.45" stopColor="#F3A42C" />
            <Stop offset="1" stopColor="#12B967" />
          </LinearGradient>
        </Defs>
        <Path
          d={arcPath}
          fill="none"
          stroke="#DCE4D8"
          strokeWidth={ARC_STROKE_WIDTH}
          strokeLinecap="round"
        />
        <Path
          d={arcPath}
          fill="none"
          stroke={compact ? 'url(#compactGaugeGradient)' : 'url(#mainGaugeGradient)'}
          strokeWidth={ARC_STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={`${length * progress} ${length}`}
        />
        <Circle
          cx={markerX}
          cy={markerY}
          r={INDICATOR_RADIUS}
          fill={colors.background.primary}
        />
      </Svg>
      <View style={styles.value}>
        <AppText variant="h1" weight="bold" style={styles.score}>{displayedScore}</AppText>
        <AppText variant="caption" weight="bold" style={{ color: presentation.color }}>{presentation.rating.toUpperCase()}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', alignItems: 'center', position: 'relative' },
  value: { position: 'absolute', top: 64, alignItems: 'center' },
  score: { color: colors.text.primary, lineHeight: 42 },
});
