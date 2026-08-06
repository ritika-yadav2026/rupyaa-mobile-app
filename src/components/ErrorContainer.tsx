import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { AppText } from './AppText';
import { spacing } from '../theme/spacing';

const ErrorContainer = (props: { responseError: string }) => {
  const { responseError } = props;
  if (!responseError) return null;
  return (
    <View style={styles.errorContainer}>
      <AppText style={styles.errorMessage}>{responseError}</AppText>
    </View>
  );
};

export default ErrorContainer;

const styles = StyleSheet.create({
  errorContainer: {
    // backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: 8,
    // borderWidth: 1,
    // borderColor: '#EF4444',
  },
  errorMessage: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
});
