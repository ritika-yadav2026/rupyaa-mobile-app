import React from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { AppText } from '../AppText';
import { typography } from '@/src/theme';

const HINT_PREFIX = 'Please use your salary account ';
const HINT_SUFFIX = ' for faster processing.';

export interface SalaryAccountHintTextProps {
  salaryAccountSuffixes: string[];
  style?: StyleProp<TextStyle>;
}

export function SalaryAccountHintText({
  salaryAccountSuffixes,
  style,
}: SalaryAccountHintTextProps): React.JSX.Element {
  return (
    <AppText
      style={[styles.helperText, style]}
      variant="caption"
      color="textprimary"
      weight="semiBold"
    >
      {HINT_PREFIX}
      {salaryAccountSuffixes.map((suffix, index) => (
        <React.Fragment key={`${suffix}-${index}`}>
          {index > 0 ? ', ' : null}
          <AppText variant="captionExtraSmall" color="primary" weight="semiBold">
            {` ending with "${suffix}"`}
          </AppText>
        </React.Fragment>
      ))}
      {HINT_SUFFIX}
    </AppText>
  );
}

const styles = StyleSheet.create({
  helperText: {
    fontSize: typography.fontSize.xxs,
  },
});
