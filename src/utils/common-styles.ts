import { StyleProp, ViewStyle } from "react-native";
import { spacing } from "../theme";

export const commonStyles: Record<string, StyleProp<ViewStyle>> = {
  image: {
    width: 200,
    height: 200,
    marginBottom: spacing.xl,
  },
  fullCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
};