import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, spacing, typography, radius } from '@/src/theme';
import { AppText } from './AppText';

interface AccordionProps {
  title: string;
  content: string;
  isOpen?: boolean;
}

export function Accordion({ title, content, isOpen: initialOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const containerStyle = [styles.container, isOpen && styles.containerActive];

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <AppText style={styles.title}>{title}</AppText>
        {isOpen ? (
          <ChevronUp size={20} color={colors.primary.main} />
        ) : (
          <ChevronDown size={20} color={colors.text.secondary} />
        )}
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.content}>
          <AppText style={styles.contentText}>{content}</AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  containerActive: {
    borderColor: colors.primary.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginRight: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  contentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
});
