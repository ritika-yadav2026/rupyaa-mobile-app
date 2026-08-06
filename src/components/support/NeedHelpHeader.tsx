import React from 'react';
import { Image, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, radius } from '@/src/theme';
import { AppText } from '@/src/components/AppText';
import { IMAGES } from '@/src/constants/images';

export interface NeedHelpHeaderProps {
  /** First name only for the greeting line (e.g. "Mansi"). */
  greetingFirstName?: string;
  onBack: () => void;
}

export function NeedHelpHeader({
  greetingFirstName,
  onBack,
}: NeedHelpHeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const greetingLine =
    greetingFirstName && greetingFirstName.length > 0
      ? `Hi ${greetingFirstName},`
      : 'Hi there,';

  return (
    <View
      style={[
        styles.headerShell,
        {
          marginHorizontal: -spacing.xl,
          paddingTop: Math.max(insets.top, spacing.md),
        },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={styles.backRow}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <ArrowLeft size={24} color={colors.text.primary} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.greetingCard}>
        <View style={styles.greetingCopy}>
          <AppText variant="h3" weight="bold" style={styles.greeting}>
            {greetingLine}
          </AppText>
          <AppText variant="body" weight="medium" style={styles.subtitle}>
            how can i help you ?
          </AppText>
        </View>
        <Image
          source={IMAGES.SUPPORT_AGENT}
          style={styles.supportAgent}
          resizeMode="contain"
          accessibilityLabel="Customer support agent"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.transparent,
  },
  backRow: {
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    marginLeft: -spacing.sm,
    paddingVertical: spacing.xs,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary.lightest_3,
    borderWidth: 1,
    borderColor: colors.primary.opacity40,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  greetingCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  greeting: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  supportAgent: {
    width: spacing['6xl'],
    height: spacing['6xl'],
  },
});
