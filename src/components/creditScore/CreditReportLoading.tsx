import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { colors, spacing } from '@/src/theme';

interface Props { detailed?: boolean }

export function CreditReportLoading({ detailed = false }: Props) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (detailed) return;
    const id = setInterval(() => setStep((value) => Math.min(2, value + 1)), 900);
    return () => clearInterval(id);
  }, [detailed]);
  return <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.primary.main} />
    {detailed ? (
      <AppText variant="caption" color="black" style={styles.detailText}>Generating your full Equifax report...</AppText>
    ) : <>
      <AppText variant="h4" weight="semiBold" style={styles.title}>Fetching your credit report</AppText>
      <AppText variant="caption" align="center" style={styles.message}>Securely pulling your score from Equifax. This{`\n`}takes a few seconds...</AppText>
      <View style={styles.steps}>
        {['Verifying your details', 'Contacting Equifax', 'Preparing your report'].map((label, index) => (
          <AppText key={label} variant="caption" color="black" style={[styles.step, index > step && styles.pendingStep]}>
            {index < step ? '✓' : '○'}  {label}
          </AppText>
        ))}
      </View>
    </>}
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.primary, padding: spacing.xl },
  title: { marginTop: spacing.xl, marginBottom: spacing.sm, color: colors.text.primary },
  message: { color: colors.text.black },
  steps: { marginTop: spacing.lg, gap: spacing.sm }, step: { minWidth: 210 },
  pendingStep: { opacity: 0.45 },
  detailText: { marginTop: spacing.xl },
});
