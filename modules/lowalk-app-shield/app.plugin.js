const fs = require("fs");
const path = require("path");

const {
  withAndroidManifest,
  withDangerousMod,
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

const SHIELD_ACTIVITY_NAME = "expo.modules.lowalkappshield.ShieldActivity";

const SHIELD_ACTIVITY_ATTRS = {
  "android:name": SHIELD_ACTIVITY_NAME,
  "android:exported": "false",
  "android:excludeFromRecents": "true",
  "android:launchMode": "singleTask",
  "android:showWhenLocked": "true",
  "android:turnScreenOn": "true",
  "android:taskAffinity": "expo.modules.lowalkappshield.shield",
  "android:theme": "@android:style/Theme.NoTitleBar.Fullscreen",
  "tools:replace": "android:excludeFromRecents",
};

function ensureManifestToolsNamespace(androidManifest) {
  const manifest = androidManifest.manifest;
  if (!manifest.$) {
    manifest.$ = {};
  }
  manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
  return androidManifest;
}

function ensureShieldActivity(androidManifest) {
  ensureManifestToolsNamespace(androidManifest);

  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  if (!app.activity) {
    app.activity = [];
  }

  const existing = app.activity.find(
    (activity) => activity.$?.["android:name"] === SHIELD_ACTIVITY_NAME,
  );

  if (existing) {
    existing.$ = { ...existing.$, ...SHIELD_ACTIVITY_ATTRS };
  } else {
    app.activity.push({ $: { ...SHIELD_ACTIVITY_ATTRS } });
  }

  return androidManifest;
}

/** Debug manifest inherits main activity stubs with excludeFromRecents=false — align with shield intent. */
function ensureShieldActivityDebugManifest(androidManifest) {
  if (!androidManifest?.manifest) {
    return androidManifest;
  }

  ensureManifestToolsNamespace(androidManifest);

  // Debug manifest may omit android:name on <application>; avoid getMainApplication
  // which crashes when filtering entries without a name.
  const applications = androidManifest.manifest.application;
  if (!applications?.length) {
    return androidManifest;
  }

  for (const app of applications) {
    if (!app.activity) {
      continue;
    }

    for (const activity of app.activity) {
      if (activity.$?.["android:name"] === SHIELD_ACTIVITY_NAME) {
        activity.$["android:excludeFromRecents"] = "true";
        activity.$["tools:replace"] = "android:excludeFromRecents";
      }
    }
  }

  return androidManifest;
}

function withShieldDebugAndroidManifest(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const manifestPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/debug/AndroidManifest.xml",
      );

      if (!fs.existsSync(manifestPath)) {
        return config;
      }

      const manifest =
        await AndroidConfig.Manifest.readAndroidManifestAsync(manifestPath);
      const patched = ensureShieldActivityDebugManifest(manifest);
      await AndroidConfig.Manifest.writeAndroidManifestAsync(
        manifestPath,
        patched,
      );

      return config;
    },
  ]);
}

function ensureHeroWidgetBootReceiver(androidManifest) {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  if (!app.receiver) {
    app.receiver = [];
  }

  const receiverName = "expo.modules.lowalkappshield.HeroWidgetBootReceiver";
  const exists = app.receiver.some(
    (receiver) => receiver.$?.["android:name"] === receiverName,
  );

  if (!exists) {
    app.receiver.push({
      $: {
        "android:name": receiverName,
        "android:exported": "false",
      },
      "intent-filter": [
        {
          action: [
            { $: { "android:name": "android.intent.action.BOOT_COMPLETED" } },
            { $: { "android:name": "android.intent.action.TIMEZONE_CHANGED" } },
            { $: { "android:name": "android.intent.action.TIME_SET" } },
          ],
        },
      ],
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
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
  ]);

  config = withAndroidManifest(config, (config) => {
    config.modResults = ensureQueries(config.modResults);
    config.modResults = ensureShieldActivity(config.modResults);
    config.modResults = ensureMonitorService(config.modResults);
    config.modResults = ensureHeroWidgetBootReceiver(config.modResults);
    AndroidConfig.Permissions.ensurePermissions(config.modResults, [
      "android.permission.PACKAGE_USAGE_STATS",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
      "android.permission.QUERY_ALL_PACKAGES",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.SCHEDULE_EXACT_ALARM",
      "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
    ]);
    return config;
  });

  config = withShieldDebugAndroidManifest(config);

  return config;
}

module.exports = createRunOncePlugin(withLowalkAppShield, PACKAGE_NAME, "1.6.2");
