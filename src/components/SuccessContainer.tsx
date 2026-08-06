import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { AppText } from './AppText';

const SuccessContainer = (props: { message: string }) => {
  const { message } = props;
  if (!message) return null;
  return (
    <View style={styles.successContainer}>
      <AppText style={styles.successMessage}>{message}</AppText>
    </View>
  );
}

export default SuccessContainer;

const styles = StyleSheet.create({
  successContainer: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  successMessage: {
    color: '#065F46',
    fontSize: 14,
    textAlign: 'center',
  },
});
