import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/src/theme';
import { StandardWebView, type StandardWebViewProps } from '@/src/components/StandardWebView';
import type { DigilockerSuccessPayload } from '@/src/types/webview';

export type DigilockerProps = {
  url: string;
  style?: StyleProp<ViewStyle>;
  webViewProps?: Omit<StandardWebViewProps, 'source' | 'containerStyle'>;
  onDigilockerSuccess?: (payload: DigilockerSuccessPayload) => void;
};

const LOADER_FALLBACK_TIMEOUT_MS = 15000;

function extractIntentFallbackUrl(intentUrl: string): string | null {
  const match = intentUrl.match(/S\.browser_fallback_url=([^;]+)/);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function isWebUrl(urlValue: string): boolean {
  return /^(https?:\/\/|about:blank|javascript:|data:)/i.test(urlValue);
}

/**
 * DigiLocker WebView component.
 * Displays the DigiLocker SDK in a WebView for document verification.
 */
export function Digilocker({
  url,
  style,
  webViewProps,
  onDigilockerSuccess,
}: DigilockerProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
    }
    fallbackTimerRef.current = null;
  }, []);

  const scheduleFallbackHide = useCallback(() => {
    clearFallbackTimer();
    fallbackTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      fallbackTimerRef.current = null;
    }, LOADER_FALLBACK_TIMEOUT_MS);
  }, [clearFallbackTimer]);

  useEffect(() => {
    setIsLoading(true);
    scheduleFallbackHide();
  }, [scheduleFallbackHide, url]);

  useEffect(() => {
    return () => {
      clearFallbackTimer();
    };
  }, [clearFallbackTimer]);

  const handleLoadStart = useCallback(
    (event: Parameters<NonNullable<StandardWebViewProps['onLoadStart']>>[0]) => {
      setIsLoading(true);
      scheduleFallbackHide();
      webViewProps?.onLoadStart?.(event);
    },
    [scheduleFallbackHide, webViewProps]
  );

  const handleLoadEnd = useCallback(
    (event: Parameters<NonNullable<StandardWebViewProps['onLoadEnd']>>[0]) => {
      clearFallbackTimer();
      setIsLoading(false);
      webViewProps?.onLoadEnd?.(event);
    },
    [clearFallbackTimer, webViewProps]
  );

  const handleLoadProgress = useCallback(
    (event: Parameters<NonNullable<StandardWebViewProps['onLoadProgress']>>[0]) => {
      if (event.nativeEvent.progress >= 0.95) {
        clearFallbackTimer();
        setIsLoading(false);
      }
      webViewProps?.onLoadProgress?.(event);
    },
    [clearFallbackTimer, webViewProps]
  );

  const handleError = useCallback(
    (event: Parameters<NonNullable<StandardWebViewProps['onError']>>[0]) => {
      clearFallbackTimer();
      setIsLoading(false);
      webViewProps?.onError?.(event);
    },
    [clearFallbackTimer, webViewProps]
  );

  const handleHttpError = useCallback(
    (event: Parameters<NonNullable<StandardWebViewProps['onHttpError']>>[0]) => {
      clearFallbackTimer();
      setIsLoading(false);
      webViewProps?.onHttpError?.(event);
    },
    [clearFallbackTimer, webViewProps]
  );

  const handleShouldStartLoad = useCallback(
    (
      request: Parameters<
        NonNullable<StandardWebViewProps['onShouldStartLoadWithRequest']>
      >[0]
    ) => {
      const parentDecision = webViewProps?.onShouldStartLoadWithRequest?.(request);
      if (parentDecision === false) {
        return false;
      }

      const requestUrl = request.url ?? '';
      if (!requestUrl || isWebUrl(requestUrl)) {
        return true;
      }

      const externalUrl = requestUrl.startsWith('intent://')
        ? extractIntentFallbackUrl(requestUrl) ?? requestUrl
        : requestUrl;

      clearFallbackTimer();
      setIsLoading(false);
      void Linking.openURL(externalUrl).catch(() => undefined);
      return false;
    },
    [clearFallbackTimer, webViewProps]
  );

  return (
    <View style={[styles.container, style]}>
      <StandardWebView
        containerStyle={styles.webViewContainer}
        loadingEnabled={false}
        source={{ uri: url }}
        originWhitelist={['*']}
        javaScriptEnabled
        scrollEnabled
        nestedScrollEnabled
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        mixedContentMode="always"
        domStorageEnabled
        scalesPageToFit
        {...webViewProps}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onLoadProgress={handleLoadProgress}
        onError={handleError}
        onHttpError={handleHttpError}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onDigilockerSuccess={onDigilockerSuccess}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background.primary,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
