import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FullScreenModal } from './FullScreenModal';
import { SanctionedStep } from './steps/SanctionedStep';

export interface PreEnachReviewGateModalProps {
  visible: boolean;
  isLoading: boolean;
  hasError: boolean;
  substepId?: string;
  onRetry: () => void;
  onBackToHome: () => void;
}

export function PreEnachReviewGateModal(
  props: PreEnachReviewGateModalProps
): React.JSX.Element {
  const { visible, onBackToHome } = props;
  return (
    <FullScreenModal
      visible={visible}
      onClose={onBackToHome}
      hideHeader
      showCloseButton={false}
      disableContentPadding
      contentContainerStyle={styles.modalContent}
    >
      <View style={styles.body}>
        <SanctionedStep
          presentation="modal"
          onNext={onBackToHome}
          onPrev={onBackToHome}
          isPreEnachReviewGateModal={true}
        />
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
  body: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
});
