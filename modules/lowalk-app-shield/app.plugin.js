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

/**
 * Usage Access + draw-over overlay + launcher package visibility for the Android shield spike.
 */
const SESSION_STATUS_GROUP = "lowalk_session_status";

/**
 * Align expo-location FGS with shield: one MIN channel, grouped summary, proper small icon.
 * Uses ic_notification (not the launcher adaptive icon) so the status bar glyph is not cropped.
 */
function withLocationSessionStatusNotificationGroup(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const ktPath = path.join(
        config.modRequest.projectRoot,
        "node_modules/expo-location/android/src/main/java/expo/modules/location/services/LocationTaskService.kt",
      );

      if (!fs.existsSync(ktPath)) {
        return config;
      }

      let source = fs.readFileSync(ktPath, "utf8");

      if (!source.includes("SESSION_STATUS_CHANNEL_ID")) {
        source = source.replace(
          "class LocationTaskService : Service() {",
          `class LocationTaskService : Service() {\n  private val SESSION_STATUS_CHANNEL_ID = "${SESSION_STATUS_GROUP}"\n`,
        );
      }

      source = source.replace(
        /prepareChannel\(mChannelId\)/g,
        "prepareChannel(SESSION_STATUS_CHANNEL_ID)",
      );
      source = source.replace(
        /Notification\.Builder\(this, mChannelId\)/g,
        "Notification.Builder(this, SESSION_STATUS_CHANNEL_ID)",
      );

      const lowChannel =
        "channel = NotificationChannel(id, appName, NotificationManager.IMPORTANCE_LOW)";
      const minChannel =
        'channel = NotificationChannel(id, "Session status", NotificationManager.IMPORTANCE_MIN)';

      if (source.includes(lowChannel)) {
        source = source.replace(lowChannel, minChannel);
      }

      const legacyLocationChannel =
        'channel = NotificationChannel(id, "Session location", NotificationManager.IMPORTANCE_MIN)';
      const minSessionStatusChannel =
        'channel = NotificationChannel(id, "Session status", NotificationManager.IMPORTANCE_MIN)';

      if (source.includes(legacyLocationChannel)) {
        source = source.replace(legacyLocationChannel, minSessionStatusChannel);
      }

      if (source.includes("Background location notification channel")) {
        source = source.replace(
          "Background location notification channel",
          "Silent indicator while a focus session runs in the background",
        );
      }

      const colorizedBlock =
        /color\?\.let \{\s*builder\.setColorized\(true\)\.setColor\(color\)\s*\} \?: run \{\s*builder\.setColorized\(false\)\s*\}/;
      const neutralColorBlock =
        "color?.let { builder.setColor(it) }\n    builder.setColorized(false)";

      if (colorizedBlock.test(source)) {
        source = source.replace(colorizedBlock, neutralColorBlock);
      }

      const groupedReturn = `val smallIcon =
      resources.getIdentifier("ic_notification", "drawable", packageName)
        .takeIf { it != 0 } ?: applicationInfo.icon

    return builder.setCategory(Notification.CATEGORY_SERVICE)
      .setGroup("${SESSION_STATUS_GROUP}")
      .setSortKey("2")
      .setSmallIcon(smallIcon)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setShowWhen(false)
      .setSilent(true)
      .setPriority(Notification.PRIORITY_MIN)
      .build()`;

      const ungroupedReturn = `return builder.setCategory(Notification.CATEGORY_SERVICE)
      .setSmallIcon(applicationInfo.icon)
      .build()`;

      if (source.includes(ungroupedReturn)) {
        source = source.replace(ungroupedReturn, groupedReturn);
      } else if (
        source.includes('.setSmallIcon(applicationInfo.icon)') &&
        !source.includes('getIdentifier("ic_notification"')
      ) {
        source = source.replace(
          /return builder\.setCategory\(Notification\.CATEGORY_SERVICE\)\s*\n\s*\.setGroup\("lowalk_session_status"\)\s*\n\s*\.setSortKey\("2"\)\s*\n\s*\.setSmallIcon\(applicationInfo\.icon\)\s*\n\s*\.build\(\)/,
          groupedReturn,
        );
      }

      fs.writeFileSync(ktPath, source);
      return config;
    },
  ]);
}

function withLowalkAppShield(config) {
  config = withLocationSessionStatusNotificationGroup(config);
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

module.exports = createRunOncePlugin(withLowalkAppShield, PACKAGE_NAME, "1.7.0");
