import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { IMAGES } from '@/src/constants/images';
import { ArrowRightIcon } from '../icons';

interface ExclusiveOfferCardProps {
  /** Small tag label (e.g., "Foreclose Loan") */
  tag: string;
  /** Main content text */
  content: string;
  /** Action link label */
  actionLabel: string;
  /** Callback when pressed */
  onPress?: () => void;
}

export function ExclusiveOfferCard({
  tag,
  content,
  actionLabel,
  onPress,
}: ExclusiveOfferCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate responsive width: ~85% of screen width, clamped between min/max
  // This ensures cards look good on all screen sizes while maintaining consistency
  const cardWidth = Math.min(Math.max(screenWidth * 0.85, 280), 320);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.9} 
      style={[styles.wrapper, { width: cardWidth }]}
    >
      <LinearGradient
        colors={['#FFF4E6', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.tag}>
          <AppText variant="captionSmall" weight="semiBold" style={styles.tagText}>
            {tag}
          </AppText>
        </View>
        <AppText variant="body" style={styles.content}>
          {content}
        </AppText>
        <View style={styles.actionRow}>
          <View style={styles.actionLeft}>
            <AppText variant="caption" weight="semiBold" style={styles.actionText}>
              {actionLabel}
            </AppText>
            <ArrowRightIcon />
          </View>
          <View style={styles.imageContainer}>
            <Image 
              source={IMAGES.EXCLUSIVE_OFFER} 
              resizeMode="contain" 
              style={styles.image} 
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginRight: spacing.base,
  },
  gradient: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE4CC',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    color: colors.text.primary,
  },
  content: {
    color: colors.text.primary,
    marginBottom: spacing.md,
    lineHeight: 22,
    fontSize: typography.fontSize.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: colors.text.primary,
    marginRight: spacing.xs,
    fontSize: typography.fontSize.xs,
  },
  imageContainer: {
    width: 120,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
