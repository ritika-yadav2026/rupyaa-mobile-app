import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Edge[];
}

export function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
}: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.container, style]} edges={edges}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingVertical: spacing.lg,
  },
  content: {
    flex: 1,
    // paddingVertical: spacing.lg,
  },
});
