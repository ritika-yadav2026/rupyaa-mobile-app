import installations from "@react-native-firebase/installations";
import { consoleLogDev } from "./common-helper";

export const getInstallationId = async () => {
  try {
    const installationId = await installations().getId();
    consoleLogDev("Firebase Installation ID:", installationId);
    return installationId;
  } catch (error) {
    console.error("Error fetching Installation ID:", error);
  }
};
