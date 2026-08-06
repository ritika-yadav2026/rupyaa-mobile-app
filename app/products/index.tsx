import React from 'react';
import { router } from 'expo-router';
import { FullScreenModal, ProductsGrid } from '@/src/components';

export default function AllProductsScreen() {
  const handleProductPress = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <FullScreenModal
      visible
      onClose={handleClose}
      title="All Products"
      subtitle="Discover a range of loan solutions tailored to your needs"
    >
      <ProductsGrid onProductPress={handleProductPress} />
    </FullScreenModal>
  );
}
