import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { colors, spacing } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { AuthHeader } from './AuthHeader';
import { IconWrapper } from './IconWrapper';

export interface SecurityNoticeScreenProps {
  /** Threat-specific message explaining why the app is blocked */
  message: string;
  /** Called when the user taps the primary action */
  onOkayPress: () => void;
  /** Optional secondary action (e.g. dev-only reset) */
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
}

/**
 * Full-screen device-security blocker. Takes over the whole screen (caller is
 * responsible for hiding the host navigator's header/tab bar) so the only way
 * forward is the single CTA.
 */
export function SecurityNoticeScreen({
  message,
  onOkayPress,
  secondaryActionLabel,
  onSecondaryActionPress,
}: SecurityNoticeScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <AuthHeader />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <IconWrapper
            icon={Alert02Icon}
            size={48}
            color={colors.warning.main}
            backgroundColor={colors.warning.bg}
            containerSize={96}
            borderRadius="full"
          />
          <AppText variant="h4" weight="semiBold" style={styles.title}>
            Security Notice
          </AppText>
          <AppText variant="body" style={styles.message}>
            {message}
          </AppText>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button variant="primary" size="large" fullWidth onPress={onOkayPress}>
          Okay
        </Button>
        {secondaryActionLabel && onSecondaryActionPress ? (
          <Button
            variant="secondary"
            size="large"
            fullWidth
            onPress={onSecondaryActionPress}
            style={styles.secondaryButton}
          >
            {secondaryActionLabel}
          </Button>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  headerWrap: {
    backgroundColor: colors.transparent,
    paddingHorizontal: spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  body: {
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  message: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.transparent,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
});
