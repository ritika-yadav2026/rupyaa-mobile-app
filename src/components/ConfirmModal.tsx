import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { colors, spacing, typography, radius } from '@/src/theme';
import { Button } from './Button';
import { AppText } from './AppText';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonVariant?: 'primary' | 'danger';
  confirmLoading?: boolean;
  disableBackdropClose?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmButtonVariant = 'primary',
  confirmLoading = false,
  disableBackdropClose = false,
}: ConfirmModalProps) {
  const { width } = useWindowDimensions();
  const isNarrowScreen = width < 360;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={disableBackdropClose ? undefined : onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={disableBackdropClose ? undefined : onCancel}
      >
        <View style={[styles.modalContainer, isNarrowScreen && styles.modalContainerNarrow]}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <AppText variant="h4" weight="semiBold" style={styles.title}>{title}</AppText>
              {message && <AppText variant="body" weight="regular" style={styles.message}>{message}</AppText>}
              <View
                style={[
                  styles.buttonContainer,
                  isNarrowScreen && styles.buttonContainerStacked,
                ]}
              >
                <Button
                  title={cancelText}
                  onPress={onCancel}
                  variant="outline"
                  disabled={confirmLoading}
                  style={styles.button}
                />
                <Button
                  title={confirmText}
                  onPress={onConfirm}
                  loading={confirmLoading}
                  disabled={confirmLoading}
                  variant={confirmButtonVariant === 'danger' ? 'primary' : 'primary'}
                  style={[
                    styles.button,
                    confirmButtonVariant === 'danger' && styles.dangerButton,
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContainerNarrow: {
    width: '92%',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonContainerStacked: {
    flexDirection: 'column-reverse',
  },
  button: {
    flex: 1,
  },
  dangerButton: {
    backgroundColor: colors.error.main,
  },
});
