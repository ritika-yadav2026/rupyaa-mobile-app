import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { ShieldCheck, Zap } from 'lucide-react-native';
import { AppText } from '../AppText';
import { colors, radius, spacing, typography } from '@/src/theme';

const COLS = 3;
const GAP = spacing.sm;
const OUTER_PADDING = spacing.xs;
const ICON_PIXEL_SIZE = 24;
const ICON_CONTAINER_SIZE = 40;
const RUPEE_CIRCLE_SIZE = 22;

type BenefitId = 'faster' | 'higher' | 'secure';

interface BenefitItem {
  id: BenefitId;
  title: string;
  subtitle: string;
}

const BENEFITS: readonly BenefitItem[] = [
  { id: 'faster', title: 'Faster Processing', subtitle: 'Auto-verified' },
  { id: 'higher', title: 'Higher Success', subtitle: 'Lower rejections' },
  { id: 'secure', title: 'Secure & Trusted', subtitle: 'Encrypted data' },
];

function renderIcon(id: BenefitId): React.ReactNode {
  if (id === 'faster') {
    return (
      <Zap
        size={ICON_PIXEL_SIZE}
        color={colors.text.black}
        fill={colors.text.black}
        strokeWidth={1.8}
      />
    );
  }
  if (id === 'higher') {
    return (
      <ShieldCheck
        size={ICON_PIXEL_SIZE}
        color={colors.text.black}
        strokeWidth={1.8}
      />
    );
  }
  return (
    <View style={styles.rupeeCircle}>
      <AppText variant="captionSmall" weight="bold" style={styles.rupeeIcon}>
        ₹
      </AppText>
    </View>
  );
}

/**
 * Three-column benefits row used by the non-salary modal. Measures real
 * available width via `onLayout` so the row never overflows on narrow Android
 * devices and the cards stay evenly spaced regardless of parent padding.
 */
export function NonSalaryBenefitsGrid(): React.JSX.Element {
  const [rowWidth, setRowWidth] = useState(0);

  const handleRowLayout = (event: LayoutChangeEvent) => {
    const measured = Math.floor(event.nativeEvent.layout.width);
    if (measured > 0 && measured !== rowWidth) {
      setRowWidth(measured);
    }
  };

  const available = rowWidth - OUTER_PADDING * 2 - GAP * (COLS - 1);
  const itemWidth = rowWidth > 0 ? Math.max(0, Math.floor(available / COLS)) : 0;

  return (
    <View onLayout={handleRowLayout} style={styles.row}>
      <View style={[styles.grid, { paddingHorizontal: OUTER_PADDING }]}>
        {BENEFITS.map((item, index) => {
          const isLast = index === BENEFITS.length - 1;
          const widthStyle = itemWidth > 0 ? { width: itemWidth } : { flex: 1 };
          return (
            <View
              key={item.id}
              style={[
                styles.card,
                widthStyle,
                { marginRight: isLast ? 0 : GAP },
              ]}
            >
              <View style={styles.iconWrap}>{renderIcon(item.id)}</View>
              <AppText
                variant="captionExtraSmall"
                weight="semiBold"
                color="textprimary"
                align="center"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.title}
              >
                {item.title}
              </AppText>
              <AppText
                variant="captionExtraSmall"
                color="textprimary"
                align="center"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.subtitle}
              >
                {item.subtitle}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    minWidth: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  iconWrap: {
    marginBottom: spacing.sm,
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary.main,
  },
  rupeeCircle: {
    width: RUPEE_CIRCLE_SIZE,
    height: RUPEE_CIRCLE_SIZE,
    borderRadius: RUPEE_CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.text.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rupeeIcon: {
    color: colors.text.black,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    textAlign: 'center',
  },
  title: {
    flexShrink: 1,
    lineHeight: 18,
  },
  subtitle: {
    marginTop: 2,
    flexShrink: 1,
  },
});
