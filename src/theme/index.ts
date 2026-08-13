import { colors } from './colors';
import { typography, getFontFamily } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { FIELD_TEXT_SIZE, getFieldTextStyle } from './fieldText';

export {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  getFontFamily,
  FIELD_TEXT_SIZE,
  getFieldTextStyle,
};

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export default theme;
