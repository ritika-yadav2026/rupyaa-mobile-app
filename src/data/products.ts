import {
  Backpack03Icon,
  Car02Icon,
  CheckmarkBadge03Icon,
  DocumentValidationIcon,
  Home01Icon,
  LaptopAddIcon,
  MentoringIcon,
  MoneyBag01Icon,
  Motorbike02Icon,
  Rocket01Icon,
  SecurityIcon,
  SmartPhone02Icon,
  ZapFreeIcons,
} from '@hugeicons/core-free-icons';
import type { Product } from '@/src/types/product';
import { IMAGES } from '@/src/constants/images';

const SHARED_FEATURES = [
  {
    title: 'Instant Disbursal',
    icon: CheckmarkBadge03Icon,
  },
  {
    title: 'Quick Approval',
    icon: DocumentValidationIcon,
  },
  {
    title: 'Trusted & Secure',
    icon: SecurityIcon,
  },
  {
    title: 'Expert Support',
    icon: MentoringIcon,
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 'personal-loan',
    title: 'Personal Loan',
    icon: MoneyBag01Icon,
    subtitle:
      'Get flexible personal loans for your needs. Whether it\'s for medical expenses, travel, or any personal requirement, we offer competitive rates and quick processing.',
    features: [...SHARED_FEATURES],
    image: IMAGES.PERSONAL_LOAN,
  },
  {
    id: 'instant-personal-loan',
    title: 'Instant Personal Loan',
    icon: ZapFreeIcons,
    subtitle:
      'Need funds urgently? Our instant personal loan gets you approved within minutes. Minimal documentation and same-day disbursal for eligible applicants.',
    features: [...SHARED_FEATURES],
    image: IMAGES.INSTANT_PERSONAL_LOAN,
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
