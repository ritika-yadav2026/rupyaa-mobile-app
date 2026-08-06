import type { Router } from 'expo-router';
import { goBackWithFallback } from './goBackWithFallback';
import { useAuthStore } from '../../store/useAuthStore';

type HomeRouter = Pick<Router, 'canGoBack' | 'back' | 'replace'>;

export const HOME_ROUTE = '/(tabs)/home' as const;

export function goHomeWithFallback(router: HomeRouter): void {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (!isAuthenticated) {
    router.replace('/auth/mobile-verification');
    return;
  }
  goBackWithFallback(router, HOME_ROUTE);
}
