import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { IMAGES } from '@/src/constants/images';

interface RupyaaLogoProps {
  style?: StyleProp<ViewStyle>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const logoSizes = {
  xs: { width: 80, height: 21 },
  sm: { width: 106, height: 28 },
  md: { width: 144, height: 38 },
  lg: { width: 190, height: 50 },
} as const;

export function RupyaaLogo({ style, size = 'sm' }: RupyaaLogoProps) {
  const dimensions = logoSizes[size];

  return (
    <View style={[styles.container, style]} accessibilityLabel="Rupyaa">
      <SvgUri
        uri={Image.resolveAssetSource(IMAGES.RUPYAA_LOGO).uri}
        width={dimensions.width}
        height={dimensions.height}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
