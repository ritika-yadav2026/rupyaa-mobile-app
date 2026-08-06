import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, spacing, radius } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';

export interface ConfirmationModalData {
  [key: string]: string;
}

const CLOSE_BUTTON_SIZE = 44;
const DRAG_HANDLE_WIDTH = 40;
const DRAG_HANDLE_HEIGHT = 4;

interface ConfirmationModalProps {
  visible: boolean;
  title?: string;
  /** For simple dialogs (e.g. logout); shown when data is absent */
  message?: string;
  /** Optional key-value data; when present shows data list with edit/confirm */
  data?: ConfirmationModalData | null;
  onEdit: () => void;
  onConfirm: () => void;
  editLabel?: string;
  confirmLabel?: string;
  /** For simple confirm/cancel dialogs (e.g. logout danger action) */
  confirmButtonVariant?: 'primary' | 'danger';
  hideCrossIcon?: boolean;
  /** Shows a loading spinner on the confirm button and disables both actions */
  confirmLoading?: boolean;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  data,
  onEdit,
  onConfirm,
  editLabel = 'Edit details',
  confirmLabel = 'Yes, proceed',
  confirmButtonVariant = 'primary',
  hideCrossIcon = true,
  confirmLoading = false,
}: ConfirmationModalProps) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const entries = data && Object.keys(data).length > 0 ? Object.entries(data) : [];
  const hasData = entries.length > 0;
  const bottomPadding = Math.max(insets.bottom, spacing.base);

  const cancelLabel = hasData ? editLabel : 'Cancel';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onEdit}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={confirmLoading ? undefined : onEdit}
      >
        <View style={[styles.keyboardAvoiding, { paddingBottom: keyboardHeight }]}>
          <TouchableOpacity
            style={[styles.modalCard, { paddingBottom: bottomPadding }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dragHandle} />
            <View style={styles.header}>
              <View style={styles.headerSpacer} />
              {!hideCrossIcon && <TouchableOpacity
                onPress={onEdit}
                style={styles.closeButton}
                activeOpacity={0.7}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={24} color={colors.text.primary} strokeWidth={2} />
              </TouchableOpacity>}
            </View>
            {title && <AppText style={styles.title} variant="h4" weight="semiBold">
              {title}
            </AppText>}
            {hasData ? (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.dataContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.dataList}>
                  {entries.map(([key, value]) => (
                    <View key={key} style={styles.row}>
                      <AppText style={styles.key} variant="caption" weight="medium">
                        {key}:
                      </AppText>
                      <AppText style={styles.value} variant="body" weight="medium">
                        {value}
                      </AppText>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              message ? (
                <AppText style={styles.message} variant="body">
                  {message}
                </AppText>
              ) : null
            )}
            <View style={styles.actions}>
              <Button
                variant="outline"
                size="large"
                onPress={onEdit}
                disabled={confirmLoading}
                style={styles.editButton}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="primary"
                size="large"
                onPress={onConfirm}
                loading={confirmLoading}
                disabled={confirmLoading}
                style={[
                  styles.confirmButton,
                  confirmButtonVariant === 'danger' && styles.dangerButton,
                ]}
              >
                {confirmLabel}
              </Button>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  dragHandle: {
    width: DRAG_HANDLE_WIDTH,
    height: DRAG_HANDLE_HEIGHT,
    borderRadius: DRAG_HANDLE_HEIGHT / 2,
    backgroundColor: colors.border.light,
    marginBottom: spacing.sm,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: spacing.xs,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
    marginTop: -spacing.sm,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    color: colors.text.secondary,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 200,
  },
  dataContent: {
    paddingBottom: spacing.md,
  },
  dataList: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.base,
  },
  key: {
    color: colors.text.secondary,
    flex: 1,
  },
  value: {
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.base,
    paddingVertical: spacing.lg,
  },
  editButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
  dangerButton: {
    backgroundColor: colors.error.main,
  },
});
