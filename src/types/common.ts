import { TextProps } from "react-native";
import { colors, typography } from "../theme";
import { LanguageCode } from "../config/languages";

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLarge' | 'caption' | 'captionSmall' | 'captionExtraSmall';
export type TextColor = keyof typeof colors.text | 'primary' | 'secondary' | 'accent' | 'error' | 'success' | 'textprimary' | 'warning' | 'black';

export interface AppTextProps extends TextProps {
    variant?: TextVariant;
    color?: TextColor;
    weight?: keyof typeof typography.fontFamily;
    align?: 'left' | 'center' | 'right';
    children: React.ReactNode;
}

export interface OnboardingLanguageOption {
    code: LanguageCode;
    flag: string;
    label: string;
}

export interface OnboardingLanguageOptionRowProps {
    option: OnboardingLanguageOption;
    isActive: boolean;
    onSelect: (language: LanguageCode) => void;
}