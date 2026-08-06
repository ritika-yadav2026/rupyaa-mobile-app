import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItem,
  Share,
  Platform,
  Linking,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Screen, AppText, Button, ZapcashLoading } from '@/src/components';
import ErrorContainer from '@/src/components/ErrorContainer';
import { colors, spacing, typography, radius } from '@/src/theme';
import {
  fetchDeviceContactsPage,
  getDeviceContactsPermission,
} from '@/src/services/contacts';
import type { DeviceContactRow } from '@/src/types';
import { appConfig } from '@/src/config/appConfig';

const AVATAR_COLORS = [
  colors.primary.main,
  colors.primary.dark,
  '#1565C0', // deep blue
  '#6A1B9A', // deep purple
  '#283593', // indigo
] as const;

function getAvatarColor(name: string | undefined): string {
  const safe = name?.trim();
  if (!safe) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < safe.length; i += 1) {
    hash = (hash + safe.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function ContactCard({
  item,
  onSend,
}: {
  item: DeviceContactRow;
  onSend: (contact: DeviceContactRow) => void;
}) {
  const initial = item.name?.trim().charAt(0).toUpperCase() ?? '?';
  const avatarColor = getAvatarColor(item.name);

  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <AppText style={styles.avatarText} numberOfLines={1}>
          {initial}
        </AppText>
      </View>
      <View style={styles.cardContent}>
        <AppText style={styles.name} numberOfLines={1}>
          {item.name}
        </AppText>
        {item.phone ? (
          <AppText style={styles.contactLine} numberOfLines={1}>
            {item.phone}
          </AppText>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button
          title="Send"
          onPress={() => onSend(item)}
          variant="primary"
          size="small"
        />
      </View>
    </View>
  );
}

type ContactsFetchStatus = 'idle' | 'loading' | 'success' | 'error' | 'permission_denied';
const PAGE_SIZE = 50;

export default function ContactsScreen() {
  const mountedRef = useRef(true);

  const [contacts, setContacts] = useState<DeviceContactRow[]>([]);
  const [contactsStatus, setContactsStatus] = useState<ContactsFetchStatus>('loading');
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [paginationOffset, setPaginationOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const getReferralMessage = useCallback(() => {
    const appName = appConfig.appName ?? 'Zapcash';
    const storeUrl = Platform.OS === 'android' ? appConfig.playStoreUrl : appConfig.appStoreUrl;
    return `Hey! I'm using ${appName} for instant personal loans. Check it out here: ${storeUrl}`;
  }, []);

  const handleSend = useCallback(
    (_contact: DeviceContactRow) => {
      const message = getReferralMessage();
      // In future we can customize per-contact if needed; for now it’s a generic referral.
      Share.share({ message }).catch(() => undefined);
    },
    [getReferralMessage],
  );

  const sortContactsByName = useCallback((list: DeviceContactRow[]): DeviceContactRow[] => {
    if (!Array.isArray(list) || list.length === 0) return [];
    // Sort by name (case-insensitive), fall back to phone when name missing.
    return [...list].sort((a, b) => {
      const nameA = a.name?.trim().toLowerCase() ?? '';
      const nameB = b.name?.trim().toLowerCase() ?? '';
      if (nameA && nameB) {
        return nameA.localeCompare(nameB);
      }
      if (nameA) return -1;
      if (nameB) return 1;
      const phoneA = a.phone?.trim() ?? '';
      const phoneB = b.phone?.trim() ?? '';
      return phoneA.localeCompare(phoneB);
    });
  }, []);

  const fetchFirstPage = useCallback(async () => {
    setContactsStatus('loading');
    setContactsError(null);
    const permissionStatus = await getDeviceContactsPermission();
    if (!mountedRef.current) return;

    if (permissionStatus !== Contacts.PermissionStatus.GRANTED) {
      setContactsStatus('permission_denied');
      return;
    }

    const page = await fetchDeviceContactsPage({
      pageOffset: 0,
      pageSize: PAGE_SIZE,
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to load contacts';
      if (mountedRef.current) {
        setContactsStatus('error');
        setContactsError(message);
      }
      return null;
    });
    if (!mountedRef.current) return;
    if (!page) return;

    setContacts(sortContactsByName(page.contacts));
    setPaginationOffset(page.nextPageOffset);
    setHasNextPage(page.hasNextPage);
    setContactsStatus('success');
  }, [sortContactsByName]);

  const fetchMoreContacts = useCallback(async () => {
    if (!hasNextPage || isFetchingMore || contactsStatus !== 'success') {
      return;
    }

    setIsFetchingMore(true);
    const page = await fetchDeviceContactsPage({
      pageOffset: paginationOffset,
      pageSize: PAGE_SIZE,
    }).catch(() => null);
    if (!mountedRef.current) return;
    setIsFetchingMore(false);
    if (!page) return;

    setContacts((previousContacts) => {
      const mergedMap = new Map<string, DeviceContactRow>();
      previousContacts.forEach((item) => mergedMap.set(item.id, item));
      page.contacts.forEach((item) => mergedMap.set(item.id, item));
      return sortContactsByName(Array.from(mergedMap.values()));
    });
    setPaginationOffset(page.nextPageOffset);
    setHasNextPage(page.hasNextPage);
  }, [contactsStatus, hasNextPage, isFetchingMore, paginationOffset, sortContactsByName]);

  useEffect(() => {
    mountedRef.current = true;
    fetchFirstPage();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFirstPage]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings().catch(() => undefined);
  }, []);

  const handleRetryContacts = useCallback(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  const renderItem: ListRenderItem<DeviceContactRow> = useCallback(
    ({ item }) => (
      <ContactCard
        item={item}
        onSend={handleSend}
      />
    ),
    [handleSend],
  );
  const keyExtractor = useCallback((item: DeviceContactRow) => item.id, []);

  if (contactsStatus === 'loading') {
    return (
      <Screen scroll={false} edges={[]} contentContainerStyle={styles.centered}>
        <ZapcashLoading visible={true} />
      </Screen>
    );
  }

  if (contactsStatus === 'permission_denied') {
    return (
      <Screen scroll={false} edges={[]} contentContainerStyle={styles.centered}>
        <AppText variant='caption' color='tertiary' style={styles.connectMessage}>
          Enable contacts permission to view your device contacts.
        </AppText>
        <Button title="Open Settings" onPress={handleOpenSettings} style={styles.connectButton} />
        <Button title="Try again" onPress={handleRetryContacts} style={styles.retryButton} />
      </Screen>
    );
  }

  if (contactsStatus === 'error') {
    return (
      <Screen scroll={false} edges={[]} contentContainerStyle={styles.centered}>
        <ErrorContainer responseError={contactsError ?? 'Failed to load contacts'} />
        <Button title="Try again" onPress={handleRetryContacts} style={styles.retryButton} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} edges={[]}>
      <FlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant='captionSmall' weight='regular' color='textprimary' style={styles.headerTitle}>
              Invite your friends to try the app. When they sign up and complete their first
              action, you both earn rewards!
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText style={styles.emptyText}>No contacts</AppText>
          </View>
        }
        onEndReachedThreshold={0.5}
        onEndReached={fetchMoreContacts}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.footerLoading}>
              <ZapcashLoading visible={true} />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  header: {
    marginBottom: spacing.lg,
    gap: spacing.base,
  },
  headerTitle: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
    marginBottom: spacing.base,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.inverse,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  iconButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sendText: {
    color: colors.primary.main,
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  contactLine: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  empty: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  connectMessage: {
    // fontSize: typography.fontSize.base,
    // color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  connectButton: {
    marginBottom: spacing.base,
  },
  retryButton: {
    marginTop: spacing.base,
  },
  footerLoading: {
    paddingVertical: spacing.base,
  },
});
