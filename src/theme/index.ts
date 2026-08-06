import { colors } from './colors';
import { typography, getFontFamily } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export { colors, typography, spacing, radius, shadows, getFontFamily };

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export default theme;
