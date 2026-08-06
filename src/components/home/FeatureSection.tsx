import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { spacing } from '@/src/theme';
import { FeatureCard } from './FeatureCard';

export interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onPress?: () => void;
}

interface FeatureSectionProps {
  /** Array of feature items to display */
  features: FeatureItem[];
}

export function FeatureSection({ features }: FeatureSectionProps) {
  if (!features?.length) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {features.map((item, index) => (
          <FeatureCard
            key={`${item.title}-${index}`}
            icon={item.icon}
            title={item.title}
            description={item.description}
            onPress={item.onPress}
            style={index < features.length - 1 ? styles.cardSpacing : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  cardSpacing: {
    marginRight: spacing.base,
  },
});
