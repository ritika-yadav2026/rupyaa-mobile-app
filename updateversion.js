const fs = require("fs");

// Path to your app.json file
const appJsonPath = "./app.json";
const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? "development";
const isDevelopment = appEnv === "development";

try {
    console.log("isDevelopment", { isDevelopment });
    // Read and parse app.json
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    const otaUpdateNumberFieldName = isDevelopment
        ? "otaUpdateNumberDev"
        : "otaUpdateNumberProd";

    // Get the current otaUpdateNumber and increment it
    let currentVersion = parseInt(
        appConfig.expo.extra[otaUpdateNumberFieldName],
        10
    );
    if (isNaN(currentVersion)) {
        throw new Error(
            "Invalid otaUpdateNumber in app.json. It should be a numeric value."
        );
    }

    // Increment the version
    currentVersion += 1;

    // Update the version in app.json
    appConfig.expo.extra[otaUpdateNumberFieldName] = currentVersion.toString();

    // Write the updated app.json back to the file
    fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2), "utf8");
    console.log(
        `Updated otaUpdateNumber to ${appConfig.expo.extra[otaUpdateNumberFieldName]}`
    );
} catch (error) {
    console.error("Error updating otaUpdateNumber:", error.message);
}
