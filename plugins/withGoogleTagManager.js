// plugins/withGoogleTagManager.js
const {
  createRunOncePlugin,
  withAppBuildGradle,
  withDangerousMod,
  IOSConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  androidContainerId: null, // GTM-XXXXXXX
  iosContainerId: null,     // GTM-XXXXXXX
  tagManagerVersion: "18.0.1",
};

/**
 * Adds Google Tag Manager dependency to Android build.gradle.
 * The Firebase Analytics SDK automatically includes GTM support,
 * but this explicit dependency ensures the full GTM SDK is available.
 */
function withGTMAndroidBuildGradle(config, options) {
  return withAppBuildGradle(config, (configMod) => {
    let contents = configMod.modResults.contents;

    const gtmDependency = `implementation 'com.google.android.gms:play-services-tagmanager:${options.tagManagerVersion}'`;

    // Check if GTM dependency already exists
    if (contents.includes("play-services-tagmanager")) {
      return configMod;
    }

    // Add GTM dependency to dependencies block
    if (/dependencies\s*\{\s*\n/.test(contents)) {
      contents = contents.replace(
        /dependencies\s*\{\s*\n/,
        (match) => `${match}    ${gtmDependency}\n`
      );
    } else if (/dependencies\s*\{/.test(contents)) {
      contents = contents.replace(
        /dependencies\s*\{/,
        (match) => `${match}\n    ${gtmDependency}\n`
      );
    }

    configMod.modResults.contents = contents;
    return configMod;
  });
}

/**
 * Creates the containers folder and copies the GTM container file for Android.
 * Container file should be placed at: android/app/src/main/assets/containers/
 */
function withGTMAndroidContainer(config, options) {
  return withDangerousMod(config, [
    "android",
    async (configMod) => {
      const projectRoot = configMod.modRequest.projectRoot;
      const containersDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "assets",
        "containers"
      );

      // Create containers directory if it doesn't exist
      if (!fs.existsSync(containersDir)) {
        fs.mkdirSync(containersDir, { recursive: true });
      }

      // If a container file source is specified, copy it
      if (options.androidContainerFile) {
        const sourcePath = path.resolve(projectRoot, options.androidContainerFile);
        if (fs.existsSync(sourcePath)) {
          const fileName = path.basename(sourcePath);
          const destPath = path.join(containersDir, fileName);
          fs.copyFileSync(sourcePath, destPath);
        }
      }

      // Create a placeholder README if directory is empty
      const readmePath = path.join(containersDir, "README.md");
      if (!fs.existsSync(readmePath)) {
        const readmeContent = `# Google Tag Manager Containers

Place your GTM container JSON file here.

## How to get the container file:
1. Sign in to your Tag Manager account
2. Select your mobile container
3. Click "Versions" in the top navigation bar
4. Click the container version you wish to use
5. Click "Download"
6. Save the file here with the name: GTM-XXXXXXX.json (your container ID)

Container ID: ${options.androidContainerId || "GTM-XXXXXXX"}
`;
        fs.writeFileSync(readmePath, readmeContent);
      }

      return configMod;
    },
  ]);
}

/**
 * Creates the containers folder for iOS.
 * Container file should be placed at: ios/<AppName>/containers/
 */
function withGTMiOSContainer(config, options) {
  return withDangerousMod(config, [
    "ios",
    async (configMod) => {
      const projectRoot = configMod.modRequest.projectRoot;
      const appName = IOSConfig.XcodeUtils.sanitizedName(
        configMod.modRequest.projectName || config.name
      );
      const containersDir = path.join(
        projectRoot,
        "ios",
        appName,
        "containers"
      );

      // Create containers directory if it doesn't exist
      if (!fs.existsSync(containersDir)) {
        fs.mkdirSync(containersDir, { recursive: true });
      }

      // If a container file source is specified, copy it
      if (options.iosContainerFile) {
        const sourcePath = path.resolve(projectRoot, options.iosContainerFile);
        if (fs.existsSync(sourcePath)) {
          const fileName = path.basename(sourcePath);
          const destPath = path.join(containersDir, fileName);
          fs.copyFileSync(sourcePath, destPath);
        }
      }

      return configMod;
    },
  ]);
}

const withGoogleTagManager = (config, options = {}) => {
  const resolved = { ...DEFAULTS, ...options };
  let next = config;

  // Add Android GTM dependency
  next = withGTMAndroidBuildGradle(next, resolved);

  // Set up Android container directory
  next = withGTMAndroidContainer(next, resolved);

  // Set up iOS container directory (if iOS is being built)
  next = withGTMiOSContainer(next, resolved);

  return next;
};

module.exports = createRunOncePlugin(
  withGoogleTagManager,
  "with-google-tag-manager",
  "1.0.0"
);
