import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '@/src/components';
import { colors, spacing, radius } from '@/src/theme';

export type LoanTabKey = 'ongoing' | 'history';

export interface LoanTabBarProps {
  activeTab: LoanTabKey;
  onTabChange: (tab: LoanTabKey) => void;
}

export function LoanTabBar({
  activeTab,
  onTabChange,
}: LoanTabBarProps): React.ReactElement {
  return (
    <View style={styles.wrapper}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabHitArea,
            activeTab === 'ongoing' && styles.tabHitAreaActive,
          ]}
          onPress={() => onTabChange('ongoing')}
          accessibilityLabel="View ongoing loans"
        >
          <AppText
            variant="captionSmall"
            weight={activeTab === 'ongoing' ? 'semiBold' : 'regular'}
            style={[
              styles.tabLabel,
              activeTab === 'ongoing' && styles.tabLabelActive,
            ]}
          >
            Ongoing Loans
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabHitArea,
            activeTab === 'history' && styles.tabHitAreaActive,
          ]}
          onPress={() => onTabChange('history')}
          accessibilityLabel="View loan history"
        >
          <AppText
            variant="captionSmall"
            weight={activeTab === 'history' ? 'semiBold' : 'regular'}
            style={[
              styles.tabLabel,
              activeTab === 'history' && styles.tabLabelActive,
            ]}
          >
            Loan History
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: radius.full,
    padding: spacing.xs,
    // Shadow for raised pill look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabHitArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  tabHitAreaActive: {
    backgroundColor: colors.primary.main,
  },
  tabLabel: {
    color: colors.text.primary,
  },
  tabLabelActive: {
    color: colors.text.inverse,
  },
});
