import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { LOTTIE_ANIMATIONS } from '@/src/constants/lottie-animations';

export function IncreasedCoins() {
  return (
    <View style={styles.container}>
      <LottieView
        source={LOTTIE_ANIMATIONS.INCREASING_COIN}
        autoPlay
        loop={false}
        style={{ width: 200, height: 200 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
