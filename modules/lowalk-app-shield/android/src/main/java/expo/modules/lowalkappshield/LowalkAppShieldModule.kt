package expo.modules.lowalkappshield

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android app shield bridge — lists launcher apps, checks permissions, and
 * starts a foreground monitor that draws over blocked apps during focus.
 */
class LowalkAppShieldModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is null" }

  override fun definition() = ModuleDefinition {
    Name("LowalkAppShield")

    Events("onBlockedAppDetected")

    AsyncFunction("isSupported") {
      true
    }

    AsyncFunction("hasUsageStatsPermission") {
      AppShieldPermissionHelper.hasUsageStatsPermission(context)
    }

    AsyncFunction("hasOverlayPermission") {
      AppShieldOverlayController.canDrawOverlays(context)
    }

    AsyncFunction("isMonitoringActive") {
      AppShieldMonitorService.isMonitoringActive(context)
    }

    AsyncFunction("openUsageAccessSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    AsyncFunction("openOverlaySettings") {
      AppShieldOverlayController.openOverlaySettings(context)
    }

    AsyncFunction("getInstalledApps") {
      listLaunchableApps(context)
    }

    AsyncFunction("getAppIcons") { packages: List<String> ->
      val pm = context.packageManager
      packages
        .map { it.trim() }
        .filter { it.isNotEmpty() }
        .distinct()
        .mapNotNull { packageName ->
          val base64 = AppIconHelper.iconBase64ForPackage(pm, packageName) ?: return@mapNotNull null
          mapOf(
            "packageName" to packageName,
            "iconBase64" to base64,
          )
        }
    }

    AsyncFunction("startMonitoring") { packages: List<String>, shieldEndsAtMs: Double, overlayContext: Map<String, Any?>? ->
      val cleaned = packages.map { it.trim() }.filter { it.isNotEmpty() }
      if (cleaned.isEmpty()) {
        throw Exception("No package names provided for monitoring.")
      }
      if (!AppShieldPermissionHelper.hasUsageStatsPermission(context)) {
        throw Exception(
          "Usage Access is required so Lowalk can detect when a blocked app opens.",
        )
      }

      overlayContext?.let { ctx ->
        ShieldOverlayContextStore.save(
          context,
          nodeKind = ctx["nodeKind"] as? String,
          headline = ctx["headline"] as? String,
          subtitle = ctx["subtitle"] as? String,
          detail = ctx["detail"] as? String,
          ctaLabel = ctx["ctaLabel"] as? String,
        )
      }

      val endsAt = shieldEndsAtMs.toLong()
      AppShieldMonitorService.start(context, cleaned, endsAt)
    }

    AsyncFunction("stopMonitoring") {
      AppShieldMonitorService.stop(context)
      AppShieldOverlayController.hide(context)
      ShieldOverlayContextStore.clear(context)
    }

    AsyncFunction("syncWidgetSchedule") { bundle: Map<String, Any?> ->
      WidgetSessionStore.saveBundle(context, bundle)
      WidgetSessionStore.requestWidgetRefresh(context)
      HeroWidgetAlarmScheduler.reschedule(context)
      ShieldOrchestrator.sync(context)
    }

    AsyncFunction("updateHeroWidgetSnapshot") { snapshot: Map<String, Any?> ->
      val legacyBundle = mapOf(
        "syncedAtMs" to System.currentTimeMillis(),
        "timezoneId" to java.util.TimeZone.getDefault().id,
        "classPreBufferMinutes" to 30,
        "sessionGapMergeMinutes" to 30,
        "dailyGoalCompleted" to (snapshot["dailyGoalCompleted"] ?: 0),
        "dailyGoalTarget" to (snapshot["dailyGoalTarget"] ?: 0),
        "blockedAppsCount" to 0,
        "blockedPackageNames" to emptyList<String>(),
        "todayIso" to "",
        "todayWeekday" to java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK) - 1,
        "nodes" to emptyList<Any>(),
        "activeSession" to null,
        "display" to snapshot,
        "intelCells" to emptyList<Any>(),
        "upcomingToday" to emptyList<Any>(),
      )
      WidgetSessionStore.saveBundle(context, legacyBundle)
      WidgetSessionStore.requestWidgetRefresh(context)
      HeroWidgetAlarmScheduler.reschedule(context)
    }

    OnDestroy {
      // Leave the service running across RN reloads only if a session still needs it.
      // Explicit stopMonitoring from JS owns teardown.
    }
  }

  private fun listLaunchableApps(context: Context): List<Map<String, String>> {
    val pm = context.packageManager
    val intent = Intent(Intent.ACTION_MAIN, null).apply {
      addCategory(Intent.CATEGORY_LAUNCHER)
    }
    @Suppress("DEPRECATION")
    val resolveInfos = pm.queryIntentActivities(intent, PackageManager.MATCH_ALL)
    val ownPackage = context.packageName

    return resolveInfos
      .mapNotNull { info ->
        val packageName = info.activityInfo?.packageName ?: return@mapNotNull null
        if (packageName == ownPackage) return@mapNotNull null
        val appInfo: ApplicationInfo = try {
          pm.getApplicationInfo(packageName, 0)
        } catch (_: PackageManager.NameNotFoundException) {
          return@mapNotNull null
        }
        val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
        val label = pm.getApplicationLabel(appInfo).toString()
        val iconBase64 = AppIconHelper.iconBase64ForPackage(pm, packageName)
        val entry = linkedMapOf(
          "packageName" to packageName,
          "name" to label,
          "isSystem" to if (isSystem) "1" else "0",
        )
        if (iconBase64 != null) {
          entry["iconBase64"] = iconBase64
        }
        entry
      }
      .distinctBy { it["packageName"] }
      .sortedBy { it["name"]?.lowercase() }
  }
}
