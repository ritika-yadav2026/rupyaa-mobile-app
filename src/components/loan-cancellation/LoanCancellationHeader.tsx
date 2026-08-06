import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppLogo } from '../AppLogo';
import { spacing } from '@/src/theme';

export function LoanCancellationHeader(): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <AppLogo size="sm" disabled />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'flex-start',
  }
});
