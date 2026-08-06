import { ViewStyle } from "react-native";
import { colors } from "../theme";
import { CancellationCalloutVariant } from "../components/loan-cancellation";

export function getVariantStyles(variant: CancellationCalloutVariant): {
  container: ViewStyle;
  titleColor: string;
  bodyColor: string;
} {
  switch (variant) {
    case 'warning':
      return {
        container: { backgroundColor: colors.error.bg },
        titleColor: colors.error.dark,
        bodyColor: colors.text.primary,
      };
    case 'info':
    case 'success':
      return {
        container: { backgroundColor: colors.success['bg-2'] },
        titleColor: colors.success.dark,
        bodyColor: colors.text.primary,
      };
    case 'outline':
      return {
        container: { backgroundColor: colors.background.primary, borderWidth: 1, borderColor: colors.border.light },
        titleColor: colors.text.primary,
        bodyColor: colors.text.primary,
      };
    default:
      return {
        container: { backgroundColor: colors.warning['bg-2'] },
        titleColor: colors.text.primary,
        bodyColor: colors.text.primary,
      };
  }
}
