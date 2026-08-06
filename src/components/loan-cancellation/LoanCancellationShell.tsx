import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullScreenModal } from '../FullScreenModal';
import { LoanCancellationHeader } from './LoanCancellationHeader';
import { spacing } from '@/src/theme';
import { CancellationStep } from './types';

export interface LoanCancellationShellProps {
  visible: boolean;
  step: CancellationStep;
  onRequestClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** When true, body fills height without ScrollView (e.g. success step). */
  fillBody?: boolean;
}

export function LoanCancellationShell({
  visible,
  onRequestClose,
  children,
  footer,
  fillBody = false,
}: LoanCancellationShellProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.md);

  // Confirm step: short content scrolls (if needed) and footer follows the body.
  // Success step: body fills height and centers the success block.
  const scrollableBody = (
    <View style={styles.scrollableContentBlock}>
      {children}
      {footer != null ? <View style={styles.inlineFooter}>{footer}</View> : null}
    </View>
  );

  return (
    <FullScreenModal
      visible={visible}
      onClose={onRequestClose}
      hideHeader
      showCloseButton={false}
      disableContentPadding
      contentContainerStyle={styles.modalContent}
    >
      <View style={styles.layout}>
        <LoanCancellationHeader />
        {fillBody ? (
          <View style={[styles.fillBody, { paddingBottom: bottomInset }]}>
            <View style={styles.bodyWrap}>{children}</View>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomInset },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {scrollableBody}
          </ScrollView>
        )}
      </View>
    </FullScreenModal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  layout: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    justifyContent: 'center',
  },
  bodyWrap: {
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollableContentBlock: {
    width: '100%',
    alignSelf: 'stretch',
    gap: spacing.lg,
  },
  inlineFooter: {
    width: '100%',
    gap: spacing.md,
  },
  fillBody: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    minHeight: 0,
    justifyContent: 'center',
  },
});
