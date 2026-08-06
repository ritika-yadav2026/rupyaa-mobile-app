import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/src/theme';
import { AppText } from './AppText';
import { IconWrapper } from './IconWrapper';
import { Alert02Icon } from '@hugeicons/core-free-icons';

type SecurityErrorScreenProps = {
  message?: string;
};

export function SecurityErrorScreen({
  message = 'Secure connection could not be verified. Please try again.',
}: SecurityErrorScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <IconWrapper
            icon={Alert02Icon}
            size={48}
            color={colors.warning.main}
            backgroundColor={colors.warning.bg}
            containerSize={96}
            borderRadius="full"
          />
        <AppText variant="h3" weight="semiBold" color="textprimary" align="center">
          Secure connection blocked
        </AppText>
        <AppText variant="captionSmall" color="textprimary" align="center">
          {message}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
