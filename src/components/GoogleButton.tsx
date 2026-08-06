import { View } from "react-native";
import { Button } from "./Button";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

export function GoogleButton() {
    const { promptAsync } = useGoogleAuth();
  return (
   <>
   <View>
      <Button
        title="Login with Google"
        onPress={() => promptAsync()}
      />
    </View>
   </>
  );
}