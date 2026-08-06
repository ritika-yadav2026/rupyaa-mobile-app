import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/src/theme';

export interface InlineLinkNoticeBoxProps {
  /** Optional heading rendered above the message. */
  title?: string;
  /** Body text shown before the link. */
  message: string;
  /** Tappable link label (default matches disbursement mock). */
  linkLabel?: string;
  onLinkPress: () => void;
  /** Screen reader label for the link control. */
  accessibilityLabel: string;
  /** When false, the link is hidden but message/title still render. Defaults to true. */
  showLink?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function InlineLinkNoticeBox({
  title,
  message,
  linkLabel = 'Click Here.',
  onLinkPress,
  accessibilityLabel,
  showLink = true,
  containerStyle,
  testID,
}: InlineLinkNoticeBoxProps): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {title != null ? (
        <AppText
          variant="caption"
          weight="semiBold"
          color="textprimary"
          style={styles.title}
        >
          {title}
        </AppText>
      ) : null}
      <View style={styles.textRow}>
        <AppText
          variant="captionSmall"
          color="textprimary"
          weight="medium"
          style={styles.message}
        >
          {message}
        </AppText>
        {showLink ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={accessibilityLabel}
            onPress={onLinkPress}
            style={({ pressed }) => [styles.linkPressable, pressed && styles.linkPressed]}
            hitSlop={8}
          >
            <AppText
              variant="captionSmall"
              weight="medium"
              color="primary"
              style={styles.link}
            >
              {linkLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.error.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    lineHeight: 20,
  },
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    minWidth: 0,
  },
  message: {
    flexShrink: 1,
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
