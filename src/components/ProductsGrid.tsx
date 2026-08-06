import React from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { ProductCard } from './home/ProductCard';
import { PRODUCTS } from '@/src/data/products';
import { colors, spacing } from '@/src/theme';

const GRID_GAP = spacing.sm;
const GRID_PADDING = spacing.base;

export interface ProductsGridProps {
  onProductPress: (productId: string) => void;
}

export function ProductsGrid({ onProductPress }: ProductsGridProps) {
  const { width } = useWindowDimensions();
  const contentWidth = width - GRID_PADDING * 2;
  const cardSize = (contentWidth - GRID_GAP * 2) / 3;

  return (
    <FlatList
      data={PRODUCTS}
      keyExtractor={(item) => item.id}
      numColumns={3}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.gridContent}
      renderItem={({ item }) => (
        <View style={[styles.cardWrapper, { width: cardSize }]}>
          <ProductCard
            icon={item.icon}
            title={item.title}
            onPress={() => onProductPress(item.id)}
            style={StyleSheet.flatten([styles.gridCard, { width: cardSize }])}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  gridContent: {
    paddingBottom: spacing['3xl'],
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  gridCard: {
    minWidth: undefined,
    maxWidth: undefined,
    marginRight: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});
