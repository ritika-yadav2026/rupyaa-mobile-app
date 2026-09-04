import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/src/theme';
import { AppText } from './AppText';

interface CountdownTimerProps {
  initialSeconds?: number;
  onResend: () => void;
  textBefore?: string;
  linkText?: string;
  accentColor?: string;
  textColor?: string;
  secondsOnlyFormat?: boolean;
}

export function CountdownTimer({
  initialSeconds = 60,
  onResend,
  textBefore = "Didn't receive the OTP?",
  linkText = 'Resend',
  accentColor,
  textColor,
  secondsOnlyFormat = false,
}: CountdownTimerProps) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, seconds]);

  const handleResend = () => {
    onResend();
    setSeconds(initialSeconds);
    setIsActive(true);
  };

  const formatTime = (time: number) => {
    if (secondsOnlyFormat) {
      return `00:${time.toString().padStart(2, '0')}s`;
    }
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLinkText = () => {
    if (isActive) {
      return (
        <AppText style={[styles.text, styles.timer, accentColor ? { color: accentColor } : null]} variant="caption">
          {t('{{linkText}} in {{time}}', { linkText: t(linkText), time: formatTime(seconds) })}
        </AppText>
      )
    }
    return (
      <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
        <AppText style={[styles.link, accentColor ? { color: accentColor } : null]} variant="caption" weight="medium">
          {t(linkText)}
        </AppText>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <AppText style={[styles.text, textColor ? { color: textColor } : null]} variant="caption">
        {`${t(textBefore)} `}
      </AppText>
      {renderLinkText()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  text: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
  },
  timer: {
    color: colors.text.tertiary,
  },
  link: {
    color: colors.primary.main,
    fontSize: 14,
    lineHeight: 21,
    textDecorationLine: 'underline',
  },
});
