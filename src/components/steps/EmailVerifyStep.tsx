import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { FormLayout } from '../FormLayout';
import type { StepProps } from '@/src/types/flow';
import { colors, spacing } from '@/src/theme';

export function EmailVerifyStep({ onNext, onPrev }: StepProps) {
  return (
    <FormLayout
      safeAreaEdges={['bottom']}
      onBack={onPrev}
      footer={
        <Button variant="primary" size="large" fullWidth onPress={onNext}>
          Continue
        </Button>
      }
    >
      <View style={styles.content}>
        <AppText style={styles.title} variant="h3" weight="bold">
          Email Verification
        </AppText>
        <AppText style={styles.subtitle} variant="body">
          Placeholder screen. Verify your email for KYC.
        </AppText>
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.base,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
  },
});
