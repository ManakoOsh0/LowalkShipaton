package expo.modules.lowalkappshield

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Persists widget schedule bundles from JS and renders offline via HeroWidgetStateEngine. */
object WidgetSessionStore {
  private const val PREF_NAME = "lowalk_hero_widget"
  private const val PREF_BUNDLE_JSON = "bundle_json"
  private const val PREF_PREMIUM_UNLOCKED = "premium_unlocked"
  /** Authoritative blocked-app packages from JS — not gated on widget premium sync. */
  private const val PREF_USER_BLOCKED_PACKAGES = "user_blocked_packages"
  private const val PREF_USER_BLOCKED_PACKAGES_SET = "user_blocked_packages_set"

  data class Snapshot(
    val state: String,
    val sessionTitle: String,
    val metaLeft: String,
    val metaRight: String,
    val headline: String,
    val subline: String?,
    val countdownLabel: String?,
    val progressRatio: Float?,
    val dailyGoalCompleted: Int,
    val dailyGoalTarget: Int,
    val updatedAtMs: Long,
    val sessionStartsAtMs: Long?,
    val sessionEndsAtMs: Long?,
    val timeWindowLabel: String?,
    val locationLabel: String?,
    val travelLabel: String?,
    val upNextFooter: String?,
    val blockedAppsLabel: String?,
  )

  private fun prefs(context: Context) =
    context.applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

  fun isPremiumUnlocked(context: Context): Boolean =
    prefs(context).getBoolean(PREF_PREMIUM_UNLOCKED, false)

  fun setPremiumUnlocked(context: Context, unlocked: Boolean) {
    prefs(context).edit()
      .putBoolean(PREF_PREMIUM_UNLOCKED, unlocked)
      .commit()
    requestWidgetRefresh(context)
  }

  fun hasPlacedWidgets(context: Context): Boolean {
    val appContext = context.applicationContext
    val manager = AppWidgetManager.getInstance(appContext)
    val heroIds =
      manager.getAppWidgetIds(ComponentName(appContext, HeroWidgetProvider::class.java))
    val hoursIds =
      manager.getAppWidgetIds(ComponentName(appContext, FocusHoursWidgetProvider::class.java))
    return heroIds.isNotEmpty() || hoursIds.isNotEmpty()
  }

  fun cancelAlarmsIfNoWidgets(context: Context) {
    if (!hasPlacedWidgets(context)) {
      HeroWidgetAlarmScheduler.cancel(context)
    }
  }

  fun saveBundle(context: Context, bundle: Map<String, Any?>) {
    val json = JSONObject(bundle as Map<*, *>).toString()
    saveBundleJson(context, json)
  }

  /** Persists a schedule bundle serialized on the JS side (nested objects safe). */
  fun saveBundleJson(context: Context, json: String) {
    val trimmed = json.trim()
    if (trimmed.isEmpty() || !trimmed.startsWith("{")) {
      throw IllegalArgumentException("Widget bundle must be a JSON object.")
    }
    // Reject malformed payloads before writing prefs.
    JSONObject(trimmed)
    prefs(context).edit()
      .putString(PREF_BUNDLE_JSON, trimmed)
      .commit()
  }

  /**
   * Persists the user's blocked-app package list from JS and patches the widget bundle copy.
   * ShieldOrchestrator prefers this over stale bundle-only data (e.g. old dev seed apps).
   */
  fun saveUserBlockedPackageNames(context: Context, packages: List<String>) {
    val cleaned = packages.map { it.trim() }.filter { it.isNotEmpty() }.distinct()
    val pref = prefs(context)
    pref.edit()
      .putStringSet(PREF_USER_BLOCKED_PACKAGES, cleaned.toSet())
      .putBoolean(PREF_USER_BLOCKED_PACKAGES_SET, true)
      .commit()

    val raw = pref.getString(PREF_BUNDLE_JSON, null)
    if (raw == null) return
    try {
      val json = JSONObject(raw)
      json.put("blockedPackageNames", JSONArray(cleaned))
      json.put("blockedAppsCount", cleaned.size)
      saveBundleJson(context, json.toString())
    } catch (_: Exception) {
      // Bundle patch is best-effort; user prefs remain authoritative for shielding.
    }
  }

  fun resolveBlockedPackageNames(
    context: Context,
    bundle: HeroWidgetStateEngine.ScheduleBundle?,
  ): List<String> {
    val pref = prefs(context)
    if (pref.getBoolean(PREF_USER_BLOCKED_PACKAGES_SET, false)) {
      return pref.getStringSet(PREF_USER_BLOCKED_PACKAGES, emptySet())
        ?.map { it.trim() }
        ?.filter { it.isNotEmpty() }
        ?.distinct()
        ?: emptyList()
    }
    return bundle?.blockedPackageNames?.filter { it.isNotBlank() } ?: emptyList()
  }

  fun loadScheduleBundle(context: Context): HeroWidgetStateEngine.ScheduleBundle? {
    val raw = prefs(context).getString(PREF_BUNDLE_JSON, null) ?: return null
    return try {
      HeroWidgetStateEngine.parseBundle(JSONObject(raw))
    } catch (_: Exception) {
      null
    }
  }

  fun loadViewModel(context: Context): HeroWidgetStateEngine.ViewModel? {
    val bundle = loadScheduleBundle(context) ?: return null
    return HeroWidgetStateEngine.compute(bundle)
  }

  fun snapshotFromJson(json: JSONObject): Snapshot {
    val progress = json.optDouble("progressRatio", -1.0)
    val sessionStartsAt = json.optLong("sessionStartsAtMs", -1L)
    val sessionEndsAt = json.optLong("sessionEndsAtMs", -1L)
    return Snapshot(
      state = json.optString("state", "up_next"),
      sessionTitle = json.optString("sessionTitle", ""),
      metaLeft = json.optString("metaLeft", "FOCUS"),
      metaRight = json.optString("metaRight", ""),
      headline = json.optString("headline", ""),
      subline = json.optString("subline").ifBlank { null },
      countdownLabel = json.optString("countdownLabel").ifBlank { null },
      progressRatio = if (progress >= 0.0) progress.toFloat() else null,
      dailyGoalCompleted = json.optInt("dailyGoalCompleted"),
      dailyGoalTarget = json.optInt("dailyGoalTarget"),
      updatedAtMs = json.optLong("updatedAtMs"),
      sessionStartsAtMs = sessionStartsAt.takeIf { it > 0L },
      sessionEndsAtMs = sessionEndsAt.takeIf { it > 0L },
      timeWindowLabel = json.optString("timeWindowLabel").ifBlank { null },
      locationLabel = json.optString("locationLabel").ifBlank { null },
      travelLabel = json.optString("travelLabel").ifBlank { null },
      upNextFooter = json.optString("upNextFooter").ifBlank { null },
      blockedAppsLabel = json.optString("blockedAppsLabel").ifBlank { null },
    )
  }

  /** Redraws every placed home-screen widget, then keeps the shared tick alarm in sync. */
  fun requestWidgetRefresh(context: Context) {
    val appContext = context.applicationContext
    val manager = AppWidgetManager.getInstance(appContext)

    val heroComponent = ComponentName(appContext, HeroWidgetProvider::class.java)
    for (id in manager.getAppWidgetIds(heroComponent)) {
      HeroWidgetProvider.updateWidget(appContext, manager, id)
    }

    val focusHoursComponent = ComponentName(appContext, FocusHoursWidgetProvider::class.java)
    for (id in manager.getAppWidgetIds(focusHoursComponent)) {
      FocusHoursWidgetProvider.updateWidget(appContext, manager, id)
    }

    try {
      if (hasPlacedWidgets(appContext)) {
        HeroWidgetAlarmScheduler.reschedule(appContext)
      } else {
        HeroWidgetAlarmScheduler.cancel(appContext)
      }
    } catch (_: Exception) {
      // Alarm permission / OEM restrictions should not block the redraw.
    }
  }
}
