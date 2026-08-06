import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import { colors, spacing } from '@/src/theme';
import { NATIVE_APP_MESSAGE_TYPES } from '@/src/constants/data';
import type {
  BankStatementSuccessPayload,
  DigilockerSuccessPayload,
  EsignSuccessPayload,
  FaceKYCSuccessPayload,
} from '@/src/types/webview';
import { ZapcashLoading } from './ZapcashLoading';

export type StandardWebViewProps = WebViewProps & {
  containerStyle?: StyleProp<ViewStyle>;
  loadingEnabled?: boolean;
  loadingOverlayStyle?: StyleProp<ViewStyle>;
  renderLoading?: () => React.ReactNode;
  onDigilockerSuccess?: (payload: DigilockerSuccessPayload) => void;
  onBankStatementSuccess?: (payload: BankStatementSuccessPayload) => void;
  onFaceKYCSuccess?: (payload: FaceKYCSuccessPayload) => void;
  onEsignSuccess?: (payload: EsignSuccessPayload) => void;
};

type NativeAppMessage = {
  type?: string;
  payload?: unknown;
  [key: string]: unknown;
};

const StandardWebViewInner = React.forwardRef<
  React.ComponentRef<typeof WebView>,
  StandardWebViewProps
>(function StandardWebView(
  {
    containerStyle,
    loadingEnabled = true,
    loadingOverlayStyle,
    renderLoading,
    onLoadStart,
    onLoadEnd,
    onDigilockerSuccess,
    onBankStatementSuccess,
    onFaceKYCSuccess,
    onEsignSuccess,
    onMessage: consumerOnMessage,
    ...webViewProps
  },
  ref
): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(loadingEnabled);
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom;
  useEffect(() => {
    if (!loadingEnabled) {
      setIsLoading(false);
    }
  }, [loadingEnabled]);

  const handleLoadStart = useCallback(
    (event: Parameters<NonNullable<WebViewProps['onLoadStart']>>[0]) => {
      if (loadingEnabled) {
        setIsLoading(true);
      }
      onLoadStart?.(event);
    },
    [loadingEnabled, onLoadStart]
  );

  const handleLoadEnd = useCallback(
    (event: Parameters<NonNullable<WebViewProps['onLoadEnd']>>[0]) => {
      if (loadingEnabled) {
        setIsLoading(false);
      }
      onLoadEnd?.(event);
    },
    [loadingEnabled, onLoadEnd]
  );

  const loadingNode = useMemo(() => {
    if (renderLoading) {
      return renderLoading();
    }
    return <ActivityIndicator size="large" color={colors.primary.main} />;
  }, [renderLoading]);

  const handleDigilockerSuccess = useCallback(
    (payload: DigilockerSuccessPayload) => {
      if (__DEV__) {
        console.log('[WebView] DigiLocker Success:', payload);
      }
      // Defer so modal close runs after WebView message handling completes (avoids intermittent not-closing).
      setTimeout(() => {
        onDigilockerSuccess?.(payload);
      }, 0);
    },
    [onDigilockerSuccess]
  );

  const handleBankStatementSuccess = useCallback(
    (payload: BankStatementSuccessPayload) => {
      if (__DEV__) {
        console.log('[WebView] Bank Statement Success:', payload);
      }
      // Defer so modal close runs after WebView message handling completes (avoids intermittent not-closing).
      setTimeout(() => {
        onBankStatementSuccess?.(payload);
      }, 0);
    },
    [onBankStatementSuccess]
  );

  const handleFaceKYCSuccess = useCallback(
    (payload: FaceKYCSuccessPayload) => {
      if (__DEV__) {
        console.log('[WebView] Face KYC Success:', payload);
      }
      // Defer so modal close runs after WebView message handling completes (avoids intermittent not-closing).
      setTimeout(() => {
        onFaceKYCSuccess?.(payload);
      }, 0);
    },
    [onFaceKYCSuccess]
  );

  const handleEsignSuccess = useCallback(
    (payload: EsignSuccessPayload) => {
      if (__DEV__) {
        console.log('[WebView] eSign Success:', payload);
      }
      // Defer so modal close runs after WebView message handling completes (avoids intermittent not-closing).
      setTimeout(() => {
        onEsignSuccess?.(payload);
      }, 0);
    },
    [onEsignSuccess]
  );

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        let parsedMessage: NativeAppMessage | null = null;
        const rawMessage = event.nativeEvent.data;

        if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
          try {
            const candidate = JSON.parse(rawMessage) as unknown;
            if (candidate && typeof candidate === 'object') {
              parsedMessage = candidate as NativeAppMessage;
            }
          } catch (parseError) {
            if (__DEV__ && !consumerOnMessage) {
              console.log('[WebView] Non-JSON message skipped:', parseError);
            }
          }
        }

        if (!parsedMessage?.type) {
          return;
        }

        const resolvedPayload = (parsedMessage.payload ?? parsedMessage) as unknown;

        switch (parsedMessage.type) {
          case NATIVE_APP_MESSAGE_TYPES.DIGILOCKER_SUCCESS:
            handleDigilockerSuccess(resolvedPayload as DigilockerSuccessPayload);
            break;
          case NATIVE_APP_MESSAGE_TYPES.BANK_STATEMENT_SUCCESS:
            handleBankStatementSuccess(resolvedPayload as BankStatementSuccessPayload);
            break;
          case NATIVE_APP_MESSAGE_TYPES.FACE_KYC_SUCCESS:
            handleFaceKYCSuccess(resolvedPayload as FaceKYCSuccessPayload);
            break;
          case NATIVE_APP_MESSAGE_TYPES.ESIGN_SUCCESS:
            handleEsignSuccess(resolvedPayload as EsignSuccessPayload);
            break;
          default:
            if (__DEV__ && !consumerOnMessage) {
              console.log('Unknown message type:', parsedMessage.type);
            }
            break;
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error parsing WebView message:', error);
        }
      } finally {
        consumerOnMessage?.(event);
      }
    },
    [
      consumerOnMessage,
      handleDigilockerSuccess,
      handleBankStatementSuccess,
      handleFaceKYCSuccess,
      handleEsignSuccess,
    ]
  );

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: bottom - 10 }, containerStyle]} edges={[]}>
      {loadingEnabled && isLoading && (
        <>
          <View style={styles.loadingOverlay}>
            <ZapcashLoading
              visible={true}
              title="Please wait..."
              message="Please wait while we load the page."
              source="StandardWebView"
            />
          </View>
        </>
      )}
      <WebView
        ref={ref}
        {...webViewProps}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onMessage={handleWebViewMessage}
      />
    </SafeAreaView>
  );
});

StandardWebViewInner.displayName = 'StandardWebView';

export const StandardWebView = StandardWebViewInner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
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
    zIndex: 1000,
  },
});
