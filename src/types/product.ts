import type { IconSvgElement } from '@hugeicons/react-native';
import { ImageSourcePropType } from 'react-native';

export interface ProductFeature {
  title: string;
  icon: IconSvgElement;
}

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  icon: IconSvgElement;
  features: ProductFeature[];
  image: ImageSourcePropType
}
