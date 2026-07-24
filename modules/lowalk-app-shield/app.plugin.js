const {
  withAndroidManifest,
  AndroidConfig,
  createRunOncePlugin,
} = require("expo/config-plugins");

const PACKAGE_NAME = "lowalk-app-shield";

function ensureQueries(androidManifest) {
  const manifest = androidManifest.manifest;
  if (!manifest.queries) {
    manifest.queries = [];
  }

  const hasLauncherQuery = manifest.queries.some((entry) => {
    const intents = entry.intent;
    if (!intents) return false;
    return intents.some((intent) => {
      const actions = intent.action ?? [];
      const categories = intent.category ?? [];
      const hasMain = actions.some(
        (action) => action.$?.["android:name"] === "android.intent.action.MAIN",
      );
      const hasLauncher = categories.some(
        (category) =>
          category.$?.["android:name"] === "android.intent.category.LAUNCHER",
      );
      return hasMain && hasLauncher;
    });
  });

  if (!hasLauncherQuery) {
    manifest.queries.push({
      intent: [
        {
          action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
          category: [
            { $: { "android:name": "android.intent.category.LAUNCHER" } },
          ],
        },
      ],
    });
  }

  return androidManifest;
}

function ensureShieldActivity(androidManifest) {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  if (!app.activity) {
    app.activity = [];
  }

  const activityName = "expo.modules.lowalkappshield.ShieldActivity";
  const exists = app.activity.some(
    (activity) => activity.$?.["android:name"] === activityName,
  );

  if (!exists) {
    app.activity.push({
      $: {
        "android:name": activityName,
        "android:exported": "false",
        "android:excludeFromRecents": "false",
        "android:launchMode": "singleTask",
        "android:taskAffinity": "expo.modules.lowalkappshield.shield",
        "android:theme": "@android:style/Theme.NoTitleBar.Fullscreen",
      },
    });
  }

  return androidManifest;
}

function ensureMonitorService(androidManifest) {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  if (!app.service) {
    app.service = [];
  }

  const serviceName = "expo.modules.lowalkappshield.AppShieldMonitorService";
  const exists = app.service.some(
    (service) => service.$?.["android:name"] === serviceName,
  );

  if (!exists) {
    app.service.push({
      $: {
        "android:name": serviceName,
        "android:exported": "false",
        "android:foregroundServiceType": "specialUse",
      },
      property: [
        {
          $: {
            "android:name": "android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE",
            "android:value": "Focus session distraction shielding",
          },
        },
      ],
    });
  }

  return androidManifest;
}

/**
 * Usage Access + draw-over overlay + launcher package visibility for the Android shield spike.
 */
function withLowalkAppShield(config) {
  config = AndroidConfig.Permissions.withPermissions(config, [
    "android.permission.PACKAGE_USAGE_STATS",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
    "android.permission.QUERY_ALL_PACKAGES",
  ]);

  return withAndroidManifest(config, (config) => {
    config.modResults = ensureQueries(config.modResults);
    config.modResults = ensureShieldActivity(config.modResults);
    config.modResults = ensureMonitorService(config.modResults);
    AndroidConfig.Permissions.ensurePermissions(config.modResults, [
      "android.permission.PACKAGE_USAGE_STATS",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
      "android.permission.QUERY_ALL_PACKAGES",
    ]);
    return config;
  });
}

module.exports = createRunOncePlugin(withLowalkAppShield, PACKAGE_NAME, "1.1.0");
