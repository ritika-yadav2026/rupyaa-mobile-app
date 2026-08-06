import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { Card } from '../Card';
import { ArrowRightIcon } from '../icons';
import { Button } from '../Button';
import { commingSoonHandler } from '@/src/utils/common-helper';

interface ProductHeroCardProps {
  /** Product image */
  image: ImageSourcePropType;
  /** Product title */
  title: string;
  /** Product subtitle/description */
  subtitle: string;
}

export function ProductHeroCard({ image, title, subtitle }: ProductHeroCardProps) {
  const handleApplyNow = () => {
    commingSoonHandler();
  };
  return (
    <Card padding="medium" style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={image} resizeMode="contain" style={styles.image} />
      </View>
      <View style={styles.textContainer}>
        <AppText variant="h3" weight="bold" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="body" color="textprimary" style={styles.subtitle}>
          {subtitle}
        </AppText>
      </View>
      {/* Action Button */}
      <Button
        title={"Apply Now"}
        onPress={handleApplyNow}
        variant="primary"
        size="small"
        rightIcon={<ArrowRightIcon color={colors.text.inverse} />}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    rowGap: spacing.md,
    marginVertical: spacing.lg,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    lineHeight: 22,
  },
});
