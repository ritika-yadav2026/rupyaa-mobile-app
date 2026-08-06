import { router, Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useEffect } from 'react';
import { resolveInitialRoute } from '@/src/services/navigation/routeResolver';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    let isActive = true;

    const navigate = async () => {
      const nextRoute = await resolveInitialRoute();
      if (isActive) {
        router.replace(nextRoute as Parameters<typeof router.replace>[0]);
      }
    };

    navigate();
    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
        presentation: 'card',
        gestureEnabled: true,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen name="mobile-verification" />
      <Stack.Screen name="otp-verification" />
    </Stack>
  );
}
