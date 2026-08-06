import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, spacing } from '@/src/theme';
import { AuthHeader } from './AuthHeader';

const MIN_HORIZONTAL_PADDING = spacing.lg;
const MAX_CONTENT_WIDTH = 400;

const GENERIC_ERROR_PHRASES = ['request failed', 'failed to fetch', 'network request failed', 'network error'];
const FRIENDLY_NO_OFFER_MESSAGE =
  'No offer found for you right now. You can try after 30 days: Meanwhile you can increase your credit score by using our tools.';

function getDisplayMessage(rawMessage: string): string {
  const trimmed = rawMessage.trim();
  if (!trimmed) return FRIENDLY_NO_OFFER_MESSAGE;
  const lower = trimmed.toLowerCase();
  const isGeneric = GENERIC_ERROR_PHRASES.some((phrase) => lower.includes(phrase));
  return isGeneric ? FRIENDLY_NO_OFFER_MESSAGE : trimmed;
}

export interface JourneyStoppedScreenProps {
  /** Reason shown to the user (e.g. "No loan found for phone ...") */
  message: string;
  onGoHome: () => void;
  /** Optional header (e.g. AuthHeader) */
  header?: ReactNode;
}

/**
 * Full-screen view when the loan journey is stopped (e.g. no offer / 404).
 * Responsive layout with scrollable message and fixed CTA.
 */
export function JourneyStoppedScreen({ message, onGoHome, header }: JourneyStoppedScreenProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = Math.max(MIN_HORIZONTAL_PADDING, (width - MAX_CONTENT_WIDTH) / 2);
  const contentWidth = Math.min(width - horizontalPadding * 2, MAX_CONTENT_WIDTH);
  const displayMessage = getDisplayMessage(message);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        {header != null ? header : <AuthHeader />}
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.content, { width: contentWidth, maxWidth: '100%' }]}>
            <AppText style={styles.title} variant="h3" weight="bold">
              Loan journey paused
            </AppText>
            <AppText style={styles.message} variant="body">
              {displayMessage}
            </AppText>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingHorizontal: horizontalPadding }]}>
          <Button variant="primary" size="large" fullWidth onPress={onGoHome}>
            Go to Home
          </Button>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  content: {
    alignSelf: 'center',
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.transparent,
  },
});
