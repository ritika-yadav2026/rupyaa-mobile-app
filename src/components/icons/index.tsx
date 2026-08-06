import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { colors } from '@/src/theme';
import { APP_ICON } from '@/src/constants/data';

interface IconProps {
    size?: number;
    color?: string;
}

export const ArrowRightIcon = ({ size = APP_ICON.SIZE, color = colors.text.primary }: IconProps) => {
  return <HugeiconsIcon icon={ArrowRight02Icon} size={size} color={color} />;
};

export const ArrowLeftIcon = ({ size = APP_ICON.SIZE, color = colors.text.primary }: IconProps) => {
  return <HugeiconsIcon icon={ArrowLeft02Icon} size={size} color={color} />;
};
