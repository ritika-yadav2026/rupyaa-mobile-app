import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { colors, spacing, radius } from '@/src/theme';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import ErrorContainer from '../../ErrorContainer';
import { IMAGES } from '@/src/constants/images';

export type PdfPasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Called with the entered password; parent retries upload with it. */
  onSubmit: (password: string) => void;
  loading?: boolean;
  errorMessage?: string;
  /** Optional file name to show which document needs the password. */
  fileName?: string;
};

const TITLE = 'PDF Password Required';
const SUBMIT_LABEL = 'Submit';

const CLOSE_BUTTON_SIZE = 44;
const DRAG_HANDLE_WIDTH = 40;
const DRAG_HANDLE_HEIGHT = 4;

/**
 * Modal shown when upload API indicates a PDF password is required/invalid.
 * Styled to match VerifyOtpModal (bottom sheet, drag handle, same padding/layout).
 */
export function PdfPasswordModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  errorMessage = '',
  fileName,
}: PdfPasswordModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (visible) {
      setPassword('');
    }
  }, [visible]);

  const handleSubmit = () => {
    const trimmed = password.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  const canSubmit = password.trim().length > 0 && !loading;
  const bottomPadding = Math.max(insets.bottom, spacing.base);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Close modal"
        accessibilityRole="button"
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
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={24} color={colors.text.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ErrorContainer responseError={errorMessage} />
            <Image source={IMAGES.LOCK} style={styles.pdfPasswordImage} resizeMode="contain" />
            <AppText style={styles.title} variant="h4" weight="semiBold">
              {TITLE}
            </AppText>
            {fileName ? (
              <AppText style={styles.subtitle} variant="body" numberOfLines={2}>
                {t('Enter password for {{fileName}}', { fileName })}
              </AppText>
            ) : null}

            <View style={styles.inputWrap}>
              <Input
                // label="PDF password"
                placeholder={t('Enter password')}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <Button
              variant="primary"
              size="large"
              fullWidth
              style={styles.submitButton}
              onPress={handleSubmit}
              loading={loading}
              disabled={!canSubmit}
            >
              {SUBMIT_LABEL}
            </Button>
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
    alignItems: 'center',
  },
  dragHandle: {
    width: DRAG_HANDLE_WIDTH,
    height: DRAG_HANDLE_HEIGHT,
    borderRadius: DRAG_HANDLE_HEIGHT / 2,
    backgroundColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 0,
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
    marginBottom: spacing.base,
  },
  subtitle: {
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputWrap: {
    marginBottom: spacing.base,
    width: '100%',
  },
  submitButton: {
    marginBottom: 10,
  },
  pdfPasswordImage: {
    width: 60,
    height: 60,
    marginBottom: spacing.xl,
  },
});
