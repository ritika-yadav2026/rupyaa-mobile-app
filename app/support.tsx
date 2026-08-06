import { useCallback, useRef } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import WebView, { type WebViewNavigation } from 'react-native-webview';
import { Screen } from '@/src/components';
import { StandardWebView } from '@/src/components/StandardWebView';
import { appConfig } from '@/src/config/appConfig';
import { HOME_ROUTE } from '@/src/services/navigation/homeNavigation';

export default function SupportScreen() {
  const router = useRouter();
  const webViewRef = useRef<React.ComponentRef<typeof WebView>>(null);
  const webCanGoBackRef = useRef(false);

  const onNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    webCanGoBackRef.current = navState.canGoBack;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return;
      }
      const onBack = () => {
        if (webCanGoBackRef.current && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        if (router.canGoBack()) {
          router.back();
          return true;
        }
        router.replace(HOME_ROUTE);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [router])
  );

  return (
    <Screen scroll={false} edges={[]}>
      <View style={styles.container}>
        <StandardWebView
          ref={webViewRef}
          source={{ uri: appConfig.supportUrl }}
          style={styles.webView}
          onNavigationStateChange={onNavigationStateChange}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
