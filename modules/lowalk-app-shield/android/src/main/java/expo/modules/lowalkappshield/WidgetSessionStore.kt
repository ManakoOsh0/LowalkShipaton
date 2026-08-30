package expo.modules.lowalkappshield

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import org.json.JSONObject

/** Persists widget schedule bundles from JS and renders offline via HeroWidgetStateEngine. */
object WidgetSessionStore {
  private const val PREF_NAME = "lowalk_hero_widget"
  private const val PREF_BUNDLE_JSON = "bundle_json"

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

  fun saveBundle(context: Context, bundle: Map<String, Any?>) {
    val json = JSONObject(bundle as Map<*, *>).toString()
    prefs(context).edit()
      .putString(PREF_BUNDLE_JSON, json)
      .commit()
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
      state = json.optString("state", "weekly_report"),
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
  }
}
