import { Screen } from '@/src/components';
import { StandardWebView } from '@/src/components/StandardWebView';
import { appConfig } from '@/src/config/appConfig';
import { StyleSheet, View } from 'react-native';

export default function FAQScreen() {
  return (
    <Screen scroll={false} edges={[]}>
      <View style={styles.container}>
        <StandardWebView
          source={{ uri: appConfig.faqUrl }}
          style={styles.webView}
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
