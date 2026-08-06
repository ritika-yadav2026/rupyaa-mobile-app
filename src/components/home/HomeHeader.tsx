import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Languages } from 'lucide-react-native';
import { colors, radius, spacing } from '@/src/theme';
import { AppLogo } from '../AppLogo';
import { AppText } from '../AppText';
import { useNotificationStore } from '@/src/store/useNotificationStore';

interface HomeHeaderProps {
  applyForLoanStyle?: boolean;
}

export function HomeHeader({ applyForLoanStyle = false }: HomeHeaderProps) {
  const router = useRouter();
  const unreadNotificationCount = useNotificationStore(
    (state) => state.unreadCount
  );
  const notificationBadgeText =
    unreadNotificationCount > 99 ? '99+' : String(unreadNotificationCount);

  const handleLanguagePress = () => {
    router.push('/language-selection');
  };

  return (
    <View style={styles.container}>
      {/* <TouchableOpacity
        onPress={onMenuPress}
        style={styles.iconButton}
        activeOpacity={0.7}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <Menu size={24} color={colors.text.primary} strokeWidth={2} />
      </TouchableOpacity> */}

      <View style={styles.logoContainer}>
        <AppLogo size="sm" />
      </View>

      <TouchableOpacity
        onPress={handleLanguagePress}
        style={styles.iconButton}
        activeOpacity={0.7}
        accessibilityLabel="Change language"
        accessibilityRole="button"
      >
        <View style={styles.languageIconWrap}>
          <Languages size={22} color={colors.text.black} />
        </View>
      </TouchableOpacity>

      {applyForLoanStyle ? (
        <View style={styles.notificationButton} accessibilityLabel="Notifications">
          <Bell size={20} color={colors.text.primary} />
          {unreadNotificationCount > 0 ? (
            <View style={styles.notificationBadge}>
              <AppText style={styles.badgeText}>{notificationBadgeText}</AppText>
            </View>
          ) : null}
        </View>
      ) : null}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xs,
    backgroundColor: colors.transparent,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  languageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.error.main,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    lineHeight: 12,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
});
