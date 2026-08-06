import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import { colors } from '@/src/theme';
import { buildHyperKycHtml } from '../utils/hyper-face-kyc';
import { StandardWebView } from '@/src/components/StandardWebView';
import type { FaceKYCSuccessPayload } from '@/src/types/webview';
import { ZapcashLoading } from './ZapcashLoading';

export type HyperKycStatus =
  | 'auto_approved'
  | 'auto_declined'
  | 'needs_review'
  | 'user_cancelled'
  | 'error';

export type HyperKycResult = {
  status: HyperKycStatus;
  code?: string;
  message?: string;
  raw?: unknown;
};

type HyperKycWebViewMessage = {
  type?: string;
  result?: HyperKycResult;
  message?: string;
  raw?: unknown;
  level?: string;
};

const VALID_HYPER_KYC_STATUS = new Set<HyperKycStatus>([
  'auto_approved',
  'auto_declined',
  'needs_review',
  'user_cancelled',
  'error',
]);

export type HyperKYCFaceProps = {
  accessToken: string;
  workflowId: string;
  transactionId: string;
  sdkVersion: string;
  showLandingPage?: boolean;
  inputImage?: string;
  onResult: (result: HyperKycResult) => void;
  onError?: (error: { message: string; raw?: unknown }) => void;
  style?: StyleProp<ViewStyle>;
};

export function HyperKYCFace({
  accessToken,
  workflowId,
  transactionId,
  sdkVersion,
  showLandingPage = false,
  inputImage,
  onResult,
  onError,
  style,
}: HyperKYCFaceProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [sdkLaunched, setSdkLaunched] = useState(false);
  const loadingTimeoutRef = useRef<number | null>(null);

  const html = useMemo(
    () =>
      buildHyperKycHtml(sdkVersion, {
        accessToken,
        workflowId,
        transactionId,
        showLandingPage,
      }, inputImage),
    [accessToken, showLandingPage, sdkVersion, transactionId, workflowId, inputImage]
  );
  // baseUrl is only the document origin for inline HTML; no request is made to it.
  // Safe in production (Play Store): content is loaded from the html string, not from this URL.
  const webViewSource = useMemo(
    () => ({
      html,
      baseUrl: 'https://localhost',
    }),
    [html]
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const rawData = event.nativeEvent.data;
      if (typeof rawData !== 'string' || rawData.trim().length === 0) {
        return;
      }

      let payload: HyperKycWebViewMessage | null = null;
      try {
        const candidate = JSON.parse(rawData) as unknown;
        if (candidate && typeof candidate === 'object') {
          payload = candidate as HyperKycWebViewMessage;
        }
      } catch {
        if (__DEV__) {
          console.log('[HyperKYC] Ignoring non-JSON message from WebView');
        }
        return;
      }

      if (payload?.type === 'result' && payload.result) {
        const result = payload.result as HyperKycResult & {
          status?: HyperKycStatus;
          errorCode?: number;
          errorMessage?: string;
        };
        // debugger;
        if (!result.status) {
          onError?.({ message: 'HyperKYC result missing status', raw: payload.result });
          return;
        }
        // Hide loading when we get a result
        setIsLoading(false);
        setHasError(false);

        // Extract error details from raw result if status is error
        const errorMessage =
          result.status === 'error'
            ? result.errorMessage || result.message || 'An error occurred during verification.'
            : result.message;

        onResult({
          status: result.status,
          code: result.code || (result.errorCode ? String(result.errorCode) : undefined),
          message: errorMessage,
          raw: payload.result,
        });
        return;
      }

      if (payload?.type === 'log') {
        const level = payload.level || 'log';
        const message = payload.message || '';
        if (level === 'error') {
          console.error(`[HyperKYC] ${message}`);
        } else if (level === 'warn') {
          console.warn(`[HyperKYC] ${message}`);
        } else {
          console.log(`[HyperKYC] ${message}`);
        }
        
        // Track when SDK launches - hide loading after SDK is ready
        // SDK has successfully launched when promise resolves
        if (message?.includes('launchSdk: HKM.launch promise resolved')) {
          setSdkLaunched(true);
          // Clear any existing timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          // Hide loading after a small delay to ensure UI is rendered
          loadingTimeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            loadingTimeoutRef.current = null;
          }, 800);
        }
        return;
      }

      if (payload?.type === 'error') {
        setIsLoading(false);
        setHasError(true);
        onError?.({
          message: payload.message || 'HyperKYC error',
          raw: payload.raw,
        });
      }
    },
    [onError, onResult]
  );

  const handleFaceKYCSuccessBridge = useCallback(
    (payload: FaceKYCSuccessPayload) => {
      const rawStatus = typeof payload.status === 'string' ? payload.status : '';
      const resolvedStatus = VALID_HYPER_KYC_STATUS.has(rawStatus as HyperKycStatus)
        ? (rawStatus as HyperKycStatus)
        : 'auto_approved';

      setIsLoading(false);
      setHasError(false);
      onResult({
        status: resolvedStatus,
        raw: payload,
      });
    },
    [onResult]
  );

  const handleWebViewError = useCallback(
    (event: { nativeEvent: { description?: string } }) => {
      console.error('handleWebViewError', event.nativeEvent.description);
      setIsLoading(false);
      setHasError(true);
      onError?.({
        message: event.nativeEvent.description || 'HyperKYC WebView error',
      });
    },
    [onError]
  );

  const handleWebViewLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleWebViewLoadEnd = useCallback(() => {
    setWebViewLoaded(true);
    // Fallback: if WebView loads but SDK doesn't launch within 5 seconds, hide loading anyway
    setTimeout(() => {
      if (isLoading && !sdkLaunched) {
        console.warn('[HyperKYC] SDK launch timeout - hiding loading state');
        setIsLoading(false);
      }
    }, 5000);
  }, [isLoading, sdkLaunched]);

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      // If user navigates away or closes, treat as cancellation
      if (navState.url !== 'about:blank' && !navState.url.includes('localhost')) {
        // User might have navigated away - we'll let the SDK handle this
        // but we can detect if they're trying to close
      }
    },
    []
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <StandardWebView
        containerStyle={styles.webViewContainer}
        loadingEnabled={false}
        originWhitelist={['*']}
        source={webViewSource}
        javaScriptEnabled
        mixedContentMode="always"
        domStorageEnabled
        // iOS: prevents the camera from hijacking the full screen instead of rendering
        // inline inside the HyperVerge overlay circle.
        allowsInlineMediaPlayback
        // iOS 15+: auto-grant camera permission within the same origin so iOS does
        // not show a secondary system prompt that falls back to the native camera UI.
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleMessage}
        onError={handleWebViewError}
        onLoadStart={handleWebViewLoadStart}
        onLoadEnd={handleWebViewLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onFaceKYCSuccess={handleFaceKYCSuccessBridge}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ZapcashLoading
            visible={true}
            title="Loading face verification…"
            message="Please wait while we load your face verification."
            source="HyperKYCFace"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    position: 'relative',
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
    zIndex: 1000,
  },
});
