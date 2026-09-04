import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, TouchableOpacity, Modal, FlatList, StyleSheet, Keyboard, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, getFieldTextStyle } from '@/src/theme';
import { useLocaleStore } from '@/src/store/useLocaleStore';
import { AppText } from './AppText';

export interface DropdownOption<T = unknown> {
  label: string;
  value: T;
}

interface DropdownSelectProps<T = unknown> {
  label: string;
  labelWeight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  /** Title shown inside the modal. Falls back to `label` if omitted. */
  modalTitle?: string;
  value?: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  /** Helper text shown below the dropdown */
  helperText?: string;
}

export function DropdownSelect<T = unknown>({
  label,
  labelWeight = 'medium',
  modalTitle,
  value,
  options,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder = 'Select an option',
  helperText,
}: DropdownSelectProps<T>) {
  const { t } = useTranslation();
  const language = useLocaleStore((state) => state.language);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? t(selectedOption.label) : t(placeholder);
  const fieldTextStyle = getFieldTextStyle(language, { isPlaceholder: !selectedOption });

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsModalVisible(false);
    onBlur?.();
  };

  const handleOpen = () => {
    Keyboard.dismiss();
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
    onBlur?.();
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.label} weight={labelWeight}>
        {t(label)}
        {required && <AppText style={styles.required}> *</AppText>}
      </AppText>
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <Text numberOfLines={1} style={[styles.inputText, fieldTextStyle]}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
      </TouchableOpacity>
      {error && <AppText style={styles.errorText}>{error}</AppText>}
      {helperText && !error && <AppText style={styles.helperText}>{helperText}</AppText>}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <AppText variant="body" weight="semiBold" color="textprimary" style={styles.modalTitle}>{modalTitle ?? label}</AppText>
            <FlatList
              data={options}
              keyExtractor={(item, index) => `option-${index}`}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.6}
                  >
                    <AppText
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </AppText>
                  </TouchableOpacity>
                );
              }}
              style={styles.optionsList}
              scrollEnabled={options.length > 4}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error.main,
  },
  input: {
    backgroundColor: colors.primary.lightest_3,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    height: 40,
    borderWidth: 1,
    borderColor: colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: colors.error.main,
  },
  inputText: {
    flex: 1,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.base,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  optionsList: {
    flexGrow: 0,
    maxHeight: 400,
  },
  optionItem: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  optionItemSelected: {
    backgroundColor: colors.primary.lightest_pro,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  optionTextSelected: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary.main,
  },
});
