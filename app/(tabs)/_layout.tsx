import { Tabs, usePathname, useRouter } from 'expo-router';
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExternalAppConfig } from '@/src/hooks/useExternalAppConfig';
import { useDocumentRequestsUser } from '@/src/hooks/useDocumentRequestsUser';
import { colors, radius, spacing, typography } from '@/src/theme';
import { HugeiconsIcon } from '@hugeicons/react-native'
import { DocumentValidationIcon, Home03Icon, MoneyBag01Icon, User02Icon } from '@hugeicons/core-free-icons'
import { HomeHeader } from '@/src/components/home/HomeHeader';
import { Screen, ZapcashLoading } from '@/src/components';
import { EXCLUDED_PATHS_HEADER } from '@/src/constants/data';
import { useAuthStore, selectIsAuthenticated } from '@/src/store/useAuthStore';
import {
  resolveInitialRoute,
  waitForBootstrap,
} from '@/src/services/navigation';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const TAB_BAR_HEIGHT = 64;
const TAB_ITEM_HEIGHT = 56;

export default function TabLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { fetchAppConfig } = useExternalAppConfig();
  const { data: documentRequestsData } = useDocumentRequestsUser();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isHomePath = pathname === '/' || pathname.endsWith('/home');
  const edges: Edge[] = EXCLUDED_PATHS_HEADER.includes(pathname) ? [] : ['top'];

  // Tabs can stay mounted on reload/deep-link; block protected routes when logged out.
  // Wait for app/index.tsx to publish its first decision before redirecting,
  // and ask resolveInitialRoute() where to send the user (onboarding vs auth)
  // instead of hardcoding the auth route — that was skipping onboarding on
  // fresh installs.
  useEffect(() => {
    if (authStatus !== 'ready' || isAuthenticated) return;

    let isActive = true;
    (async () => {
      await waitForBootstrap();
      // Re-check auth after waiting — user may have logged in during bootstrap.
      if (!isActive || useAuthStore.getState().isAuthenticated) return;

      const route = await resolveInitialRoute();
      if (isActive) {
        router.replace(route as Parameters<typeof router.replace>[0]);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [authStatus, isAuthenticated, router]);

  const documentsTabBadge = useMemo(() => {
    const listRaw = documentRequestsData?.data;
    // Backend may return `data` as non-array (null/object) during schema changes or failures.
    const list = Array.isArray(listRaw) ? listRaw : [];
    const pendingCount = list.filter(
      (d) => d?.status === 'pending' || d?.status === 'rejected'
    ).length;
    return pendingCount > 0 ? pendingCount : undefined;
  }, [documentRequestsData]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchAppConfig();
    }
  }, [isAuthenticated, fetchAppConfig]);

  if (authStatus !== 'ready' || !isAuthenticated) {
    return <ZapcashLoading visible />;
  }

  return (
    <>
      <Screen scroll={false} edges={edges}>
        <Tabs
          screenOptions={{
            headerShown: true,
            header: () => <HomeHeader applyForLoanStyle={isHomePath} />,
            sceneStyle: { backgroundColor: colors.transparent },
            tabBarActiveTintColor: colors.text.black,
            tabBarInactiveTintColor: colors.text.tertiary,
            tabBarStyle: {
              backgroundColor: colors.text.black,
              borderTopColor: colors.transparent,
              borderTopWidth: 0,
              height: TAB_BAR_HEIGHT,
              borderRadius: 30,
              marginHorizontal: spacing.md,
              marginBottom: Math.max(insets.bottom, spacing.xs),
              paddingHorizontal: spacing.xs,
              paddingVertical: 0,
            },
            tabBarHideOnKeyboard: true,
            tabBarActiveBackgroundColor: colors.primary.main,
            tabBarItemStyle: {
              height: TAB_ITEM_HEIGHT,
              marginVertical: spacing.xs,
              borderRadius: radius.full,
              overflow: 'hidden',
            },
            tabBarLabelPosition: 'below-icon',
            tabBarLabelStyle: {
              fontSize: 10,
              lineHeight: 12,
              fontWeight: '500',
              fontFamily: typography.fontFamily.medium,
              marginTop: 2,
              marginBottom: -2,
              padding: 0,
            },
            tabBarIconStyle: {
              width: 24,
              height: 24,
              margin: 0,
              padding: 0,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: t('Home'),
              tabBarIcon: ({ size, color }) => <HugeiconsIcon icon={Home03Icon} size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="my-loan"
            options={{
              title: t('My Loan'),
              tabBarIcon: ({ size, color }) => <HugeiconsIcon icon={MoneyBag01Icon} size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="documents"
            options={{
              title: t('Documents'),
              tabBarIcon: ({ size, color }) => <HugeiconsIcon icon={DocumentValidationIcon} size={size} color={color} />,
              tabBarBadge: documentsTabBadge,
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              headerShown: false,
              title: t('Account'),
              tabBarIcon: ({ size, color }) => <HugeiconsIcon icon={User02Icon} size={size} color={color} />,
            }}
          />
        </Tabs>
      </Screen>
    </>
  );
}
