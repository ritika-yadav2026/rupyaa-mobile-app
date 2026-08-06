import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { devConfig } from '@/src/config/dev';
import { colors, typography } from '@/src/theme';
import { AppText } from './AppText';

export function DevTools() {
  const router = useRouter();

  if (!devConfig.enableDebugLogs) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push('/dev-panel')}
      style={styles.fab}
      activeOpacity={0.8}
    >
      <AppText style={styles.fabText}>DEV</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    // top:120,
    bottom: 124,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: colors.primary.contrast,
    fontSize: 10,
    fontFamily: typography.fontFamily.semiBold,
  },
});
