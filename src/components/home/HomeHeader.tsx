import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Languages } from 'lucide-react-native';
import { colors, radius, spacing } from '@/src/theme';
import { AppLogo } from '../AppLogo';

interface HomeHeaderProps {
  applyForLoanStyle?: boolean;
}

export function HomeHeader({ applyForLoanStyle: _applyForLoanStyle = false }: HomeHeaderProps) {
  const router = useRouter();

  const handleLanguagePress = () => {
    router.push('/language-selection');
  };

  return (
    <View style={styles.container}>
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
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
});
