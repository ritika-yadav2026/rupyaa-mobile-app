// import { useCallback } from "react";
// import { useFocusEffect } from "@react-navigation/native";
// import * as ScreenCapture from "expo-screen-capture";

// export function useSecureScreen(key: string) {
//   useFocusEffect(
//     useCallback(() => {
//       ScreenCapture.preventScreenCaptureAsync(key);
//       return () => ScreenCapture.allowScreenCaptureAsync(key);
//     }, [key])
//   );
// }
