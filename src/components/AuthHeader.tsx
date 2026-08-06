import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '@/src/theme';
import { AppLogo } from './AppLogo';

export interface AuthHeaderProps {
  /** Show back button on the left */
  showBackButton?: boolean;
  /** Callback when back button is pressed */
  onBackPress?: () => void;
  /** Content to render on the right (e.g. Info, Refresh icons) */
  rightContent?: React.ReactNode;
  /** Optional style override for the header container */
  style?: ViewStyle;
  /** Disable logo press */
  disableLogoPress?: boolean;
}

export function AuthHeader({
  rightContent,
  style,
  disableLogoPress = false,
}: AuthHeaderProps) {

  const renderRightContent = () => {
    if (rightContent) {
      return rightContent;
    }
    return null;
  }

  return (
    <View style={[styles.header, style]}>
      {/* render back button */}
      {/* {renderBackButton()} */}

      <View style={styles.center}>
        <AppLogo size="xs" disabled={disableLogoPress} />
      </View>

      <View style={styles.right}>{renderRightContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
  },
  center: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginLeft: -5
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
});
