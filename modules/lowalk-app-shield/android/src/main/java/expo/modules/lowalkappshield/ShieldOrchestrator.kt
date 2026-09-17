package expo.modules.lowalkappshield

import android.content.Context

/**
 * Starts/stops the native shield monitor from offline schedule data and persists overlay copy.
 */
object ShieldOrchestrator {
  fun sync(context: Context) {
    val appContext = context.applicationContext
    val bundle = WidgetSessionStore.loadScheduleBundle(appContext)
    val packages = WidgetSessionStore.resolveBlockedPackageNames(appContext, bundle)

    if (bundle == null || packages.isEmpty()) {
      if (AppShieldMonitorService.isMonitoringActive(appContext)) {
        AppShieldMonitorService.stop(appContext)
      }
      ShieldAlarmScheduler.cancel(appContext)
      return
    }

    val nowMs = System.currentTimeMillis()
    if (ShieldScheduleEngine.isShieldActive(bundle, nowMs)) {
      if (AppShieldPermissionHelper.hasUsageStatsPermission(appContext)) {
        val obligation = ShieldScheduleEngine.selectPrimaryObligationNode(bundle, nowMs)
        if (obligation != null) {
          ShieldOverlayContextStore.save(
            appContext,
            nodeKind = obligation.kind,
            headline = "Apps locked.",
            subtitle = "Stay present for ${obligation.title}.",
            detail = obligation.title,
            ctaLabel = "Close",
          )
        }
        val endsAt = ShieldScheduleEngine.computeShieldEndsAtMs(bundle, nowMs)
        AppShieldMonitorService.start(appContext, packages, endsAt)
      }
    } else if (AppShieldMonitorService.isMonitoringActive(appContext)) {
      AppShieldMonitorService.stop(appContext)
    }

    ShieldAlarmScheduler.reschedule(appContext)
  }
}
