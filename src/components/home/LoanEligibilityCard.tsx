import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Card } from '../Card';
import { IMAGES } from '@/src/constants/images';
import { ArrowRightIcon } from '../icons';

interface LoanEligibilityCardProps {
  /** Card title */
  title: string;
  /** Description text */
  description: string;
  /** Button label (e.g., "Check Eligibility") */
  buttonLabel: string;
  /** Callback when button is pressed */
  onPress: () => void;
}

export function LoanEligibilityCard({
  title,
  description,
  buttonLabel,
  onPress,
}: LoanEligibilityCardProps) {
  return (
    <Card padding="medium" shadow="none" bordered onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.textSection}>
          <AppText variant="body" weight="semiBold" style={styles.title}>
            {title}
          </AppText>
          <AppText variant="bodyLarge" weight="regular" style={styles.description}>
            {description}
          </AppText>
    
        </View>
      </View>
      <View style={styles.actionRow}>
        <Button
          title={buttonLabel}
          onPress={onPress}
          variant="primary"
          size="medium"
          rightIcon={<ArrowRightIcon color={colors.text.inverse} />}
          style={styles.button}
        />  
        <View style={styles.imageContainer}>
          <Image source={IMAGES.LOAN_ELIGIBILITY} resizeMode="contain" style={styles.loanEligibilityImage} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textSection: {
    flex: 1,
    marginRight: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  description: {
    marginBottom: spacing.lg,
    lineHeight: 20,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  button: {
    width: '48%',
    borderRadius: radius.md,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanEligibilityImage: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
