import { Screen } from "@/src/components";
import { StandardWebView } from "@/src/components/StandardWebView";
import { StyleSheet, View } from "react-native";
import { appConfig } from "@/src/config/appConfig";

export default function GrievanceRedressalMechanismScreen() {
  return (
    <Screen scroll={false} edges={[]}>
      <View style={styles.container}>
        <StandardWebView
          source={{ uri: appConfig.grievanceRedressalMechanismUrl }}
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