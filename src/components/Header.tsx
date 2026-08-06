import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';
import { ArrowLeftIcon } from './icons';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
}

export function Header({
  title,
  showBack = false,
  rightAction,
  onBackPress,
}: HeaderProps) {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <ArrowLeftIcon size={24} />
          </TouchableOpacity>
        )}
        {title && (
          <AppText variant="h4" weight="semiBold" color='textprimary'>
            {title}
          </AppText>
        )}
      </View>
      {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.transparent,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  rightSection: {
    marginLeft: spacing.sm,
  },
});
