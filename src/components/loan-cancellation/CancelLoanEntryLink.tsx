import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../AppText';
import { colors, spacing } from '@/src/theme';

export interface CancelLoanEntryLinkProps {
  /** When false, only the question text is shown (no tappable link). */
  showLink: boolean;
  onLinkPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Inline "Not interested in loan? Cancel loan" entry below a primary CTA.
 * Link visibility is gated by the caller (e.g. cancel-eligibility API).
 */
export function CancelLoanEntryLink({
  showLink,
  onLinkPress,
  accessibilityLabel = 'Cancel loan',
  testID,
}: CancelLoanEntryLinkProps): React.JSX.Element {
  return (
    <View style={styles.container} testID={testID}>
      {showLink ? (
        <>
          <AppText variant="captionSmall" color={"textprimary"} style={styles.questionText}>
            Not interested in loan?
          </AppText>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={accessibilityLabel}
            onPress={onLinkPress}
            style={({ pressed }) => [styles.linkPressable, pressed && styles.linkPressed]}
            hitSlop={8}
          >
            <AppText variant="captionSmall" weight="medium" color="primary" style={styles.link}>
              Cancel loan
            </AppText>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    minWidth: 0,
  },
  questionText: {
    lineHeight: 20,
  },
  linkPressable: {
    paddingVertical: 2,
  },
  linkPressed: {
    opacity: 0.75,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
