import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/src/theme';
import { StandardWebView, type StandardWebViewProps } from '@/src/components/StandardWebView';
import type { BankStatementSuccessPayload } from '@/src/types/webview';

export type BankConnectWebViewProps = {
  url: string;
  style?: StyleProp<ViewStyle>;
  webViewProps?: Omit<StandardWebViewProps, 'source' | 'containerStyle' | 'onBankStatementSuccess'>;
  onBankStatementSuccess?: (payload: BankStatementSuccessPayload) => void;
};

const LOADER_FALLBACK_TIMEOUT_MS = 15000;

/**
 * WebView component for the bank connect / bank statement verification flow.
 * Handles BANK_STATEMENT_SUCCESS messages from the web and invokes onBankStatementSuccess.
 */
export function BankConnectWebView({
  url,
  style,
  webViewProps,
  onBankStatementSuccess,
}: BankConnectWebViewProps): React.JSX.Element {
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
        onBankStatementSuccess={onBankStatementSuccess}
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
