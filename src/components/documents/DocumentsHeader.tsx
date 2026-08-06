import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { spacing } from '@/src/theme';

export function DocumentsHeader(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <AppText variant="h4" weight="semiBold" color="textprimary">
        Document Requests
      </AppText>
      <AppText variant="captionSmall" color="textprimary" style={styles.subtitle}>
        Upload requested documents for your loan application
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
});
