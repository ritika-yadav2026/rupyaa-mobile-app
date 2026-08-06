import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { colors, spacing, typography, radius } from '@/src/theme';
import { Button } from './Button';
import { AppText } from './AppText';

/** One missing capability to explain in the modal (e.g. Camera + why it is needed). */
export interface SettingsPromptDetailItem {
  title: string;
  description?: string;
}

export interface SettingsPromptModalProps {
  visible: boolean;
  title?: string;
  /** Short intro above the detail list. */
  message?: string;
  /** What is still missing and why — keeps copy out of this component so it stays reusable. */
  detailItems?: readonly SettingsPromptDetailItem[];
  /** Optional fine print (e.g. “we will not redirect you to Settings automatically”). */
  footnote?: string;
  onOpenSettings: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  openSettingsLabel?: string;
}

export function SettingsPromptModal({
  visible,
  title = 'Permissions needed',
  message = 'Some required permissions are still off. Enable them in your device Settings to continue.',
  detailItems,
  footnote,
  onOpenSettings,
  onCancel,
  cancelLabel = 'Not now',
  openSettingsLabel = 'Open Settings',
}: SettingsPromptModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const detailsMaxHeight = Math.min(windowHeight * 0.32, 260);
  // Narrow screens: less outer + card padding so paired CTAs keep one line; avoid TouchableOpacity around ScrollView (breaks scroll on Android).
  const isCompactLayout = windowWidth < 400;

  const hasDetails = detailItems && detailItems.length > 0;

  const overlayStyle = [
    styles.overlay,
    isCompactLayout ? styles.overlayCompact : null,
  ];
  const modalContentStyle = [
    styles.modalContent,
    isCompactLayout ? styles.modalContentCompact : null,
  ];
  const buttonRowStyle = [
    styles.buttonContainer,
    isCompactLayout ? styles.buttonContainerCompact : null,
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={overlayStyle}>
        {/* Backdrop only: must not wrap the card or ScrollView will not receive vertical pans (Android). */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        />
        <View style={styles.modalOuter} pointerEvents="box-none">
          <View style={modalContentStyle}>
            <AppText variant="h4" weight="semiBold" color="textprimary" style={styles.title}>
              {title}
            </AppText>

            {message ? (
              <AppText variant="captionSmall" weight="regular" color="textprimary" style={styles.message}>
                {message}
              </AppText>
            ) : null}

            {hasDetails ? (
              <ScrollView
                style={[styles.detailScroll, { maxHeight: detailsMaxHeight }]}
                contentContainerStyle={styles.detailScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {detailItems.map((item, index) => (
                  <View
                    key={`${item.title}-${index}`}
                    style={[
                      styles.detailRow,
                      index < detailItems.length - 1 && styles.detailRowBorder,
                    ]}
                  >
                    <AppText variant="caption" weight="semiBold" color="textprimary">
                      {item.title}
                    </AppText>
                    {item.description ? (
                      <AppText
                        variant="captionSmall"
                        weight="regular"
                        color="textprimary"
                        style={styles.detailDescription}
                      >
                        {item.description}
                      </AppText>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {footnote ? (
              <AppText variant="captionSmall" weight="regular" color="textprimary" style={styles.footnote}>
                {footnote}
              </AppText>
            ) : null}

            <View style={buttonRowStyle}>
              <Button
                title={cancelLabel}
                onPress={onCancel}
                variant="outline"
                size="small"
                style={styles.button}
                textSize="xs"
              />
              <Button
                title={openSettingsLabel}
                onPress={onOpenSettings}
                variant="primary"
                size="small"
                style={styles.button}
                textSize="xs"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  overlayCompact: {
    paddingHorizontal: spacing.md,
  },
  modalOuter: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  modalContentCompact: {
    padding: spacing.lg,
  },
  title: {
    // textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    // textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  detailScroll: {
    marginBottom: spacing.md,
    flexGrow: 0,
  },
  detailScrollContent: {
    flexGrow: 0,
  },
  detailRow: {
    paddingVertical: spacing.sm,
  },
  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  detailDescription: {
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
  footnote: {
    // textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonContainerCompact: {
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});
