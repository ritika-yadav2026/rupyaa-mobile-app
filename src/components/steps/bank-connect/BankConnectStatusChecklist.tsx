import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle, Circle, X } from 'lucide-react-native';
import { AppText } from '@/src/components/AppText';
import { colors, spacing } from '@/src/theme';
import type { BankConnectChecklistItem } from './bankConnectContinueMessages';

const ICON_SIZE = 24;

type BankConnectStatusChecklistProps = {
  items: BankConnectChecklistItem[];
};

function ChecklistRow({ item }: { item: BankConnectChecklistItem }): React.JSX.Element {
  const isWaiting = item.state === 'waiting';
  const isDone = item.state === 'done';
  const isFailed = item.state === 'failed';
  const isInProgress = item.state === 'in-progress';

  return (
    <View style={styles.row}>
      <View style={styles.iconWrapper}>
        {isDone && (
          <CheckCircle size={ICON_SIZE} color={colors.success.main} />
        )}
        {isInProgress && (
          <ActivityIndicator size="small" color={colors.primary.main} />
        )}
        {isWaiting && (
          <Circle size={ICON_SIZE} color={colors.border.main} strokeWidth={2} />
        )}
        {isFailed && (
          <X size={ICON_SIZE} color={colors.error.main} />
        )}
      </View>
      <AppText
        style={[
          styles.label,
          isWaiting && styles.labelWaiting,
        ]}
        variant="body"
        weight={isWaiting ? 'regular' : 'medium'}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {item.label}
      </AppText>
    </View>
  );
}

/**
 * Renders a vertical checklist of bank-connect status steps.
 * Each row shows an icon (done / in-progress / waiting / failed) and a label.
 */
export function BankConnectStatusChecklist({
  items,
}: BankConnectStatusChecklistProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <ChecklistRow key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    minHeight: 56,
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginRight: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
    color: colors.text.primary,
  },
  labelWaiting: {
    color: colors.text.tertiary,
  },
});
