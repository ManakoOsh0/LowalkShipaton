package expo.modules.lowalkappshield

import android.appwidget.AppWidgetManager
import android.content.Context
import android.util.Log
import android.widget.RemoteViews

/**
 * Compact home-screen widget: lifetime focus hours on a flat dashboard tile.
 */
class FocusHoursWidgetProvider : android.appwidget.AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (id in appWidgetIds) {
      updateWidget(context, appWidgetManager, id)
    }
  }

  companion object {
    private const val TAG = "FocusHoursWidget"
    private const val TAP_REQUEST_CODE = 42012
    private const val PAYWALL_TAP_REQUEST_CODE = 42013

    fun updateWidget(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetId: Int,
    ) {
      val views =
        WidgetLayouts.remoteViews(context, "widget_focus_hours")
          ?: run {
            Log.e(TAG, "widget_focus_hours missing — cannot update widget")
            return
          }

      val palette = WidgetTileAppearance.defaults(context)
      WidgetTileAppearance.applyHoursTile(views, palette)

      val premiumUnlocked = WidgetSessionStore.isPremiumUnlocked(context)
      if (!premiumUnlocked) {
        views.setTextViewText(R.id.focus_hours_value, "0h")
        views.setTextViewText(R.id.focus_hours_label, "time saved")
        WidgetPremiumGate.applyLockedState(views, R.id.widget_lock_overlay)
        views.setOnClickPendingIntent(
          R.id.focus_hours_root,
          WidgetPremiumGate.buildPaywallTapIntent(context, PAYWALL_TAP_REQUEST_CODE),
        )
        appWidgetManager.updateAppWidget(appWidgetId, views)
        return
      }

      WidgetPremiumGate.applyUnlockedState(views, R.id.widget_lock_overlay)

      try {
        val bundle = WidgetSessionStore.loadScheduleBundle(context)
        val resolvedPalette = bundle?.appearance ?: palette
        val minutes = bundle?.totalFocusMinutes ?: 0
        val (value, label) = formatFocusHours(minutes)
        WidgetTileAppearance.applyHoursTile(views, resolvedPalette)
        views.setTextViewText(R.id.focus_hours_value, value)
        views.setTextViewText(R.id.focus_hours_label, label)
        views.setOnClickPendingIntent(
          R.id.focus_hours_root,
          WidgetPremiumGate.buildAppLaunchIntent(context, TAP_REQUEST_CODE),
        )
        appWidgetManager.updateAppWidget(appWidgetId, views)
      } catch (error: Exception) {
        Log.e(TAG, "updateWidget failed", error)
        try {
          WidgetTileAppearance.applyHoursTile(views, palette)
          views.setTextViewText(R.id.focus_hours_value, "0h")
          views.setTextViewText(R.id.focus_hours_label, "time saved")
          views.setOnClickPendingIntent(
            R.id.focus_hours_root,
            WidgetPremiumGate.buildAppLaunchIntent(context, TAP_REQUEST_CODE),
          )
          appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (fallbackError: Exception) {
          Log.e(TAG, "widget fallback failed", fallbackError)
        }
      }
    }

    /** Matches JS `formatFocusDuration` — e.g. 40h 30m, 40h, 45m. */
    fun formatFocusHours(totalMinutes: Int): Pair<String, String> {
      if (totalMinutes <= 0) return "0h" to "time saved"
      val hours = totalMinutes / 60
      val minutes = totalMinutes % 60
      val value =
        when {
          hours > 0 && minutes > 0 -> "${hours}h ${minutes}m"
          hours > 0 -> "${hours}h"
          else -> "${minutes}m"
        }
      return value to "time saved"
    }
  }
}
