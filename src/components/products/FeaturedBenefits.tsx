import React from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors, spacing } from '@/src/theme';
import { AppText } from '../AppText';
import { Card } from '../Card';
import type { ProductFeature } from '@/src/types/product';
import { HugeiconsIcon } from '@hugeicons/react-native';

const COLS = 4;
const GAP = spacing.sm;
const OUTER_PADDING = spacing.md;

interface FeaturedBenefitsProps {
  features: ProductFeature[];
}

export function FeaturedBenefits({ features }: FeaturedBenefitsProps) {
  const [rowWidth, setRowWidth] = React.useState(0);

  if (!features?.length) return null;
  const displayFeatures = features.slice(0, 4);

  const onRowLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== rowWidth) setRowWidth(w);
  };

  const available = rowWidth - OUTER_PADDING * 2 - GAP * (COLS - 1);
  const itemWidth = rowWidth > 0 ? Math.floor(available / COLS) : 0;

  return (
    <View style={styles.container}>
      <AppText variant="h4" weight="bold" style={styles.sectionTitle}>
        Featured Benefits
      </AppText>

      {/* This view measures the REAL width available */}
      <View onLayout={onRowLayout} style={styles.rowWrapper}>
        <View style={[styles.grid, { paddingHorizontal: OUTER_PADDING }]}>
          {displayFeatures.map((feature, idx) => (
            <Card
              key={feature.title}
              padding="small"
              shadow="sm"
              style={[
                styles.benefitCard,
                itemWidth > 0 ? { width: itemWidth } : { flex: 1 }, // fallback while measuring
                { marginRight: idx === displayFeatures.length - 1 ? 0 : GAP },
              ]}
            >
              <View style={styles.benefitContent}>
                <View style={styles.icon}>
                  <HugeiconsIcon icon={feature.icon} size={24} color={colors.text.primary} strokeWidth={1.5} />
                </View>

                <AppText
                  variant="caption"
                  weight="semiBold"
                  style={styles.benefitTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {feature.title}
                </AppText>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text.primary, marginBottom: spacing.lg },

  rowWrapper: {
    width: '100%',
  },

  grid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  benefitCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    backgroundColor: colors.background.secondary,
    // Important to prevent children from forcing overflow
    overflow: 'hidden',
  },

  benefitContent: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
    minWidth: 0, // important so text doesn't push width
  },

  icon: { marginBottom: spacing.md },

  benefitTitle: {
    color: colors.text.primary,
    textAlign: 'left',
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1,
  },
});
