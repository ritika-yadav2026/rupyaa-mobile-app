import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { IMAGES } from '@/src/constants/images';

interface NeedHelpCardProps {
  onContactPress?: () => void;
}

export const NeedHelpCard = ({ onContactPress }: NeedHelpCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.textSection}>
        <View style={styles.titleRow}>
          <AppText variant="h4" weight="bold" color="textprimary">Need Help? </AppText>
          <AppText
            variant="h4"
            weight="semiBold"
            color="primary"
            style={styles.italicText}
          >
            Let&apos;s Talk
          </AppText>
        </View>

        <AppText variant="captionSmall" color="textprimary" style={styles.description}>
          Have a question or need help with your loan? Our team is here for you.
        </AppText>

        <Button
          variant="primary"
          size="small"
          onPress={onContactPress}
          style={styles.contactButton}
          textSize="sm"
        >
          Contact us
        </Button>
      </View>

      <Image
        source={IMAGES.LETSTALK}
        style={styles.mascotImage}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  textSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    // flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  italicText: {
    // fontStyle: 'italic',
  },
  description: {
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginBottom: spacing.md,
  },
  contactButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  mascotImage: {
    width: 110,
    height: 130,
  },
});
