import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, typography } from '@/src/theme';

/**
 * "+91" prefix for Indian mobile/phone fields. Use as leftAccessory in FormInput/ControlledInput.
 */
export function PhonePrefix() {
  return (
    <View style={styles.container}>
      <AppText style={styles.text} variant="body" weight="medium">
        +91
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  text: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
  },
});
