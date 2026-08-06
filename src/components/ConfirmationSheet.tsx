import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface ConfirmationField {
  label: string;
  value: string;
}

interface ConfirmationSheetProps {
  visible: boolean;
  /** Short sheet heading; omit when only `description` is shown. */
  title?: string;
  /** Body copy (e.g. API validation message); shown without label/value rows. */
  description?: string;
  data?: ConfirmationField[] | null;
  onEdit: () => void;
  onConfirm: () => void;
  editLabel?: string;
  confirmLabel?: string;
  /** When false, only the dismiss/edit action is shown (e.g. blocking validation). */
  showConfirmButton?: boolean;
  confirmLoading?: boolean;
  onClose?: () => void;
  accentColor?: string;
}

export function ConfirmationSheet({
  visible,
  title,
  description,
  data = null,
  onEdit,
  onConfirm,
  editLabel = 'Edit details',
  confirmLabel = 'Yes, proceed',
  showConfirmButton = true,
  confirmLoading = false,
  onClose,
  accentColor,
}: ConfirmationSheetProps) {
  const insets = useSafeAreaInsets();
  const entries = data ?? [];
  const trimmedTitle = title?.trim() ?? '';
  const trimmedDescription = description?.trim() ?? '';
  const hasTitle = trimmedTitle.length > 0;
  const hasDescription = trimmedDescription.length > 0;
  const hasData = entries.length > 0;
  const handleClose = onClose ?? onEdit;
  const bottomPadding = Math.max(insets.bottom, spacing.base);
  const editButtonBaseStyle = showConfirmButton ? styles.editButton : styles.singleActionButton;
  const editButtonAccentStyle = accentColor
    ? showConfirmButton
      ? { borderColor: accentColor }
      : { backgroundColor: accentColor }
    : null;

  const handleEdit = () => {
    if (confirmLoading) return;
    onEdit();
  };

  const handleConfirm = () => {
    if (confirmLoading) return;
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={confirmLoading ? undefined : handleClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={confirmLoading ? undefined : handleClose}
      >
        <TouchableOpacity
          style={[styles.sheet, { paddingBottom: bottomPadding }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          {hasTitle ? (
            <AppText style={styles.title} variant="h3" weight="bold">
              {trimmedTitle}
            </AppText>
          ) : null}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.dataList}
            showsVerticalScrollIndicator={false}
          >
            {hasDescription ? (
              <AppText
                style={[
                  styles.description,
                  !hasTitle && styles.descriptionWithoutTitle,
                ]}
                variant="body"
                weight="regular"
              >
                {trimmedDescription}
              </AppText>
            ) : null}
            {hasData &&
              entries.map(({ label, value }) => (
                <View key={label} style={styles.row}>
                  <AppText style={styles.key} variant="caption" weight="medium">
                    {label}
                  </AppText>
                  <AppText style={styles.value} variant="body" weight="medium">
                    {value}
                  </AppText>
                </View>
              ))}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              variant={showConfirmButton ? 'outline' : 'primary'}
              size="small"
              onPress={handleEdit}
              disabled={confirmLoading}
              style={[editButtonBaseStyle, editButtonAccentStyle]}
              textStyle={accentColor ? styles.accentButtonText : undefined}
            >
              {editLabel}
            </Button>
            {showConfirmButton ? (
              <Button
                variant="primary"
                size="small"
                onPress={handleConfirm}
                loading={confirmLoading}
                disabled={confirmLoading}
                style={[styles.confirmButton, accentColor ? { backgroundColor: accentColor } : null]}
                textStyle={accentColor ? styles.accentButtonText : undefined}
              >
                {confirmLabel}
              </Button>
            ) : null}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    backgroundColor: colors.border.light ?? colors.border.main,
    alignSelf: 'center',
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  description: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  descriptionWithoutTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  scrollView: {
    maxHeight: 320,
  },
  dataList: {
    paddingBottom: spacing.md,
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
  singleActionButton: {
    flex: 1,
  },
  accentButtonText: {
    color: colors.text.black,
  },
});
