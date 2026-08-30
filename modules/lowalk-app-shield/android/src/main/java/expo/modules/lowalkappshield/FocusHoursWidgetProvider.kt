package expo.modules.lowalkappshield

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews
import java.util.Locale

/**
 * Compact home-screen widget: lifetime focus hours + tilted hourglass.
 * Duolingo-style hierarchy — big number, short label, bottom graphic.
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
    private const val TAP_REQUEST_CODE = 42012

    fun updateWidget(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetId: Int,
    ) {
      val views = RemoteViews(context.packageName, R.layout.widget_focus_hours)
      val minutes = WidgetSessionStore.loadScheduleBundle(context)?.totalFocusMinutes ?: 0
      val (value, label) = formatFocusHours(minutes)
      views.setTextViewText(R.id.focus_hours_value, value)
      views.setTextViewText(R.id.focus_hours_label, label)
      views.setOnClickPendingIntent(R.id.focus_hours_root, buildTapIntent(context))
      appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    /** Matches JS weekly focus formatting — scannable number + unit line. */
    fun formatFocusHours(totalMinutes: Int): Pair<String, String> {
      if (totalMinutes <= 0) return "0" to "hours saved"
      if (totalMinutes < 60) return totalMinutes.toString() to "min saved"
      val hours = totalMinutes / 60.0
      val value =
        if (hours >= 10.0) {
          hours.toInt().toString()
        } else {
          String.format(Locale.US, "%.1f", hours)
        }
      return value to "hours saved"
    }

    private fun buildTapIntent(context: Context): PendingIntent {
      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        ?: Intent(Intent.ACTION_MAIN).apply {
          addCategory(Intent.CATEGORY_LAUNCHER)
          setPackage(context.packageName)
        }
      launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag()
      return PendingIntent.getActivity(context, TAP_REQUEST_CODE, launchIntent, flags)
    }

    private fun immutableFlag(): Int =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
  }
}
