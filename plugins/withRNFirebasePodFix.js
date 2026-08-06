const { createRunOncePlugin, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const STATIC_FRAMEWORK_SNIPPET = `# RNFirebase pods need this when \`use_frameworks! :linkage => :static\` is enabled.
# Without it, RNFB pods can fail compiling against React-Core headers as framework modules.
if podfile_properties['ios.useFrameworks'] == 'static' || ENV['USE_FRAMEWORKS'] == 'static'
  $RNFirebaseAsStaticFramework = true
end

`;

const NON_MODULAR_HEADERS_SNIPPET = `    # Xcode 16+ can reject RNFB framework module imports of non-modular React headers.
    installer.pods_project.targets.each do |target|
      next unless target.name.start_with?('RNFB')

      target.build_configurations.each do |build_config|
        build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
`;

function applyPodfileFixes(contents) {
  let next = contents;

  if (!next.includes("$RNFirebaseAsStaticFramework = true")) {
    const platformMatch = next.match(/platform :ios[^\n]*\n/);
    if (!platformMatch) {
      throw new Error("Failed to apply RNFirebase static framework fix: iOS platform line not found in Podfile.");
    }
    next = next.replace(platformMatch[0], `${STATIC_FRAMEWORK_SNIPPET}${platformMatch[0]}`);
  }

  if (!next.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
    const reactNativePostInstallMatch = next.match(
      /react_native_post_install\([\s\S]*?\n\s+\)\n/
    );
    if (!reactNativePostInstallMatch) {
      throw new Error(
        "Failed to apply RNFirebase non-modular header fix: react_native_post_install block not found."
      );
    }
    next = next.replace(
      reactNativePostInstallMatch[0],
      `${reactNativePostInstallMatch[0]}\n${NON_MODULAR_HEADERS_SNIPPET}`
    );
  }

  return next;
}

function withRNFirebasePodFix(config) {
  return withDangerousMod(config, [
    "ios",
    async (configMod) => {
      const podfilePath = path.join(configMod.modRequest.platformProjectRoot, "Podfile");

      if (!fs.existsSync(podfilePath)) {
        return configMod;
      }

      const original = fs.readFileSync(podfilePath, "utf8");
      const updated = applyPodfileFixes(original);

      if (updated !== original) {
        fs.writeFileSync(podfilePath, updated);
      }

      return configMod;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withRNFirebasePodFix,
  "with-rnfirebase-pod-fix",
  "1.0.0"
);
