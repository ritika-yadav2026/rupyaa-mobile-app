const { createRunOncePlugin, withAppBuildGradle } = require('expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const META_REFERRER_DEPENDENCY = "implementation 'com.adjust.sdk:adjust-android-meta-referrer:5.5.0'";
const GPS_ADS_ID_DEPENDENCY = "implementation 'com.google.android.gms:play-services-ads-identifier:18.1.0'";
const PLAY_SERVICES_ANALYTICS_LINE_PATTERN = /implementation\s+'com\.google\.android\.gms:play-services-analytics:[^']+'/;
const PLAY_SERVICES_ANALYTICS_WITH_EXCLUDE = `implementation('com.google.android.gms:play-services-analytics:18.0.1') {
        exclude group: 'com.google.android.gms', module: 'play-services-tagmanager-v4-impl'
      }`;

function addMetaReferrerDependency(src) {
  return mergeContents({
    tag: 'adjust-android-meta-referrer',
    src,
    newSrc: `  ${META_REFERRER_DEPENDENCY}\n`,
    anchor: /dependencies(?:\s+)?\{/,
    offset: 1,
    comment: '//',
  });
}

function addGpsAdsIdentifierDependency(src) {
  return mergeContents({
    tag: 'adjust-gps-ads-identifier',
    src,
    newSrc: `  ${GPS_ADS_ID_DEPENDENCY}\n`,
    anchor: /dependencies(?:\s+)?\{/,
    offset: 1,
    comment: '//',
  });
}

function excludeDiscontinuedTagManagerImpl(src) {
  if (src.includes(PLAY_SERVICES_ANALYTICS_WITH_EXCLUDE)) {
    return src;
  }

  return src.replace(PLAY_SERVICES_ANALYTICS_LINE_PATTERN, PLAY_SERVICES_ANALYTICS_WITH_EXCLUDE);
}

const withAdjustMetaReferrer = (config) =>
  withAppBuildGradle(config, (configMod) => {
    if (configMod.modResults.language !== 'groovy') {
      throw new Error('Cannot add Adjust meta referrer dependency because app build.gradle is not groovy');
    }

    const contentsWithExcludedTagManagerImpl = excludeDiscontinuedTagManagerImpl(
      configMod.modResults.contents
    );

    configMod.modResults.contents = addMetaReferrerDependency(
      addGpsAdsIdentifierDependency(contentsWithExcludedTagManagerImpl).contents
    ).contents;
    return configMod;
  });

module.exports = createRunOncePlugin(
  withAdjustMetaReferrer,
  'with-adjust-meta-referrer',
  '1.0.0'
);
