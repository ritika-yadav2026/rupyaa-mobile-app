import { Redirect } from 'expo-router';
import { DEFAULT_DEEP_LINK_FALLBACK_ROUTE } from '@/src/utils/route-map';

/**
 * Unknown routes (e.g. unmapped deep links that bypass native-intent) go to home.
 */
export default function NotFoundScreen() {
  return <Redirect href={DEFAULT_DEEP_LINK_FALLBACK_ROUTE} />;
}
