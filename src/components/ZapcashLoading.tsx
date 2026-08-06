import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/src/theme';
import { AppText } from './AppText';
import { IMAGES } from '@/src/constants/images';
import { consoleLogDev } from '../utils/common-helper';

const OVERLAY_Z_INDEX = 9999;
const LOG_PREFIX = '[ZapcashLoading]';
const GIF_SIZE = 40;
// const SPINNER_SIZE = GIF_SIZE + 40; // Spinner slightly larger than icon
const SPINNER_SIZE = GIF_SIZE + 25;
const SPINNER_STROKE_WIDTH = 3;

export interface ZapcashLoadingProps {
  /** When true, the full-screen loading overlay is visible. */
  visible: boolean;
  /** Optional title shown above the spinner. */
  title?: string;
  /** Optional message/subtitle shown below the title. */
  message?: string;
  /**
   * Caller identifier for logs (e.g. 'ApprovedOfferStep', 'BankConnectStep').
   * Helps trace which screen is showing the loader.
   */
  source?: string;
  /** Optional GIF (e.g. from GIF_VIDEOS.ZAPCASH_LOADING) to show instead of ActivityIndicator. */
  gifSource?: ImageSourcePropType;
  /** Optional reassurance text shown below the message (e.g. security message). */
  reassuranceText?: string;
}

/**
 * Full-screen loading overlay, same rendering strategy as OfferStatusModal/IneligibilityModal.
 * Reusable anywhere we need to block the screen until a condition is resolved (e.g. offer loaded).
 */
export function ZapcashLoading({
  visible,
  title,
  message,
  source = 'unknown',
  gifSource=IMAGES.Z_ICON,
  reassuranceText,
}: ZapcashLoadingProps): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const prevVisibleRef = useRef(false);

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      consoleLogDev(`${LOG_PREFIX} visible=true source=${source} title=${title ?? '(none)'}`);
    }
    if (!visible && prevVisibleRef.current) {
      consoleLogDev(`${LOG_PREFIX} visible=false source=${source}`);
    }
    prevVisibleRef.current = visible;
  }, [visible, source, title]);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  useEffect(() => {
    if (visible) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  // Perfectly smooth rotation — Easing.linear ensures constant speed with no ease-in/out
  // between loop iterations, eliminating any visible stutter or jerk.
  useEffect(() => {
    rotateAnim.setValue(0);
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          // paddingTop: insets.top,
          paddingBottom: insets.bottom,
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.content}>
          <View style={styles.iconContainer}>
            {gifSource != null ? (
              <>
                <Animated.View
                  style={[
                    styles.spinnerRing,
                    {
                      transform: [{ rotate: spin }],
                    },
                  ]}
                />
                <Image
                  source={gifSource}
                  style={styles.gif}
                  resizeMode="contain"
                  accessibilityLabel="Loading"
                />
              </>
            ) : (
              <ActivityIndicator size="large" color={colors.primary.main} style={styles.spinner} />
            )}
          </View>
          {title != null && title.length > 0 ? (
            <AppText style={styles.title} variant="h4" weight="semiBold">
              {title}
            </AppText>
          ) : null}
          {message != null && message.length > 0 ? (
            <AppText style={styles.message} variant="caption">
              {message}
            </AppText>
          ) : null}
      </View>
      {reassuranceText != null && reassuranceText.length > 0 && (
        <View style={[styles.reassuranceContainer, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
          <AppText style={styles.reassuranceText} variant="caption">
            {reassuranceText}
          </AppText>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent,
    // backgroundColor: 'blue',
    zIndex: OVERLAY_Z_INDEX,
    elevation: OVERLAY_Z_INDEX,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  spinnerRing: {
    position: 'absolute',
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: SPINNER_STROKE_WIDTH,
    borderColor: colors.primary.lightest || colors.primary.light,
    borderTopColor: colors.primary.main,
    borderRightColor: colors.primary.main,
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  gif: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    backgroundColor: colors.background.primary,
    zIndex: 1,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  reassuranceContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    alignItems: 'center',
    // backgroundColor: 'red',
  },
  reassuranceText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
