import React from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/src/theme';

interface ConsentNoticeProps {
  text: string;
  hideLockIcon?: boolean;
  icon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function ConsentNotice({
  text,
  icon = <ShieldCheck size={18} color={colors.primary.main} />,
  containerStyle,
  textStyle,
}: ConsentNoticeProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <AppText variant="captionSmall" color='textprimary' weight="medium" style={[styles.text, textStyle]}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: spacing.sm,
    columnGap: spacing.xs,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flexShrink: 1,
    lineHeight: 24,
  },
});
