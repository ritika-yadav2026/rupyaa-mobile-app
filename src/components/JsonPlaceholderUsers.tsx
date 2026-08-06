import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Button } from '@/src/components';
import { useJsonPlaceholderUsers } from '@/src/services/api/jsonPlaceholder';
import { colors, spacing } from '@/src/theme';

export function JsonPlaceholderUsers() {
  const { data, isLoading, error, refetch, isFetching } = useJsonPlaceholderUsers();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppText variant="caption" weight="medium" style={styles.title}>
          JSONPlaceholder Users
        </AppText>
        <Button
          variant="outline"
          size="small"
          onPress={() => refetch()}
          style={styles.refreshButton}
        >
          {isFetching ? 'Refreshing...' : 'Refetch'}
        </Button>
      </View>

      {isLoading ? (
        <AppText variant="caption" style={styles.mono}>
          Loading users...
        </AppText>
      ) : error ? (
        <AppText variant="caption" style={styles.errorText}>
          {error instanceof Error ? error.message : 'Request failed'}
        </AppText>
      ) : data && data.length > 0 ? (
        <View style={styles.list}>
          {data.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <AppText variant="caption" weight="medium" style={styles.userName}>
                {user.name}
              </AppText>
              <AppText variant="caption" style={styles.mono}>
                {user.email} | {user.phone}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="caption" style={styles.mono}>
          No users returned.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text.secondary,
  },
  refreshButton: {
    marginBottom: 0,
  },
  list: {
    gap: spacing.sm,
  },
  userRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  userName: {
    color: colors.text.primary,
  },
  mono: {
    fontFamily: 'monospace',
    color: colors.text.secondary,
  },
  errorText: {
    color: colors.error.main,
  },
});
