package expo.modules.lowalkappshield

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.View
import android.widget.RemoteViews

/** Home screen focus widget — three lines on a neutral gray tile. */
class HeroWidgetProvider : android.appwidget.AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (id in appWidgetIds) {
      updateWidget(context, appWidgetManager, id)
    }
    try {
      HeroWidgetAlarmScheduler.reschedule(context)
    } catch (error: Exception) {
      Log.e(TAG, "reschedule failed after onUpdate", error)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == ACTION_WIDGET_TICK) {
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, HeroWidgetProvider::class.java)
      val ids = manager.getAppWidgetIds(component)
      for (id in ids) {
        updateWidget(context, manager, id)
      }
      try {
        HeroWidgetAlarmScheduler.reschedule(context)
      } catch (error: Exception) {
        Log.e(TAG, "reschedule failed after tick", error)
      }
    }
  }

  override fun onDisabled(context: Context) {
    HeroWidgetAlarmScheduler.cancel(context)
    super.onDisabled(context)
  }

  override fun onEnabled(context: Context) {
    HeroWidgetAlarmScheduler.reschedule(context)
    super.onEnabled(context)
  }

  companion object {
    const val ACTION_WIDGET_TICK = "expo.modules.lowalkappshield.action.WIDGET_TICK"
    private const val TAG = "HeroWidgetProvider"
    private const val TAP_REQUEST_CODE = 42002
    private const val PAYWALL_TAP_REQUEST_CODE = 42003

    fun updateWidget(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetId: Int,
    ) {
      val views =
        WidgetLayouts.remoteViews(context, "widget_focus_tile")
          ?: run {
            Log.e(TAG, "widget_focus_tile missing — cannot update widget")
            return
          }

      val palette = WidgetTileAppearance.defaults(context)
      WidgetTileAppearance.applyFocusTile(views, palette)

      val premiumUnlocked = WidgetSessionStore.isPremiumUnlocked(context)
      if (!premiumUnlocked) {
        bindLockedPlaceholder(views)
        WidgetPremiumGate.applyLockedState(views, R.id.widget_lock_overlay)
        views.setOnClickPendingIntent(
          R.id.widget_root,
          WidgetPremiumGate.buildPaywallTapIntent(context, PAYWALL_TAP_REQUEST_CODE),
        )
        appWidgetManager.updateAppWidget(appWidgetId, views)
        return
      }

      WidgetPremiumGate.applyUnlockedState(views, R.id.widget_lock_overlay)

      try {
        val bundle = WidgetSessionStore.loadScheduleBundle(context)
        val resolvedPalette = bundle?.appearance ?: palette

        if (bundle != null) {
          val viewModel = HeroWidgetStateEngine.compute(bundle)
          WidgetTileAppearance.applyFocusTile(views, resolvedPalette)
          bindViewModel(views, viewModel, bundle)
        } else {
          WidgetTileAppearance.applyFocusTile(views, resolvedPalette)
          bindPlaceholder(views)
        }
        views.setOnClickPendingIntent(
          R.id.widget_root,
          WidgetPremiumGate.buildAppLaunchIntent(context, TAP_REQUEST_CODE),
        )
        appWidgetManager.updateAppWidget(appWidgetId, views)
      } catch (error: Exception) {
        Log.e(TAG, "updateWidget failed", error)
        try {
          WidgetTileAppearance.applyFocusTile(views, palette)
          bindPlaceholder(views)
          views.setOnClickPendingIntent(
            R.id.widget_root,
            WidgetPremiumGate.buildAppLaunchIntent(context, TAP_REQUEST_CODE),
          )
          appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (fallbackError: Exception) {
          Log.e(TAG, "widget fallback failed", fallbackError)
        }
      }
    }

    private fun bindLockedPlaceholder(views: RemoteViews) {
      val date = WidgetDateLabel.format(null, null)
      views.setTextViewText(R.id.tile_title, "Lowalk")
      views.setTextViewText(R.id.tile_date_weekday, date.weekday)
      views.setTextViewText(R.id.tile_date_day, date.day)
      views.setViewVisibility(R.id.tile_active_timer, View.VISIBLE)
      views.setViewVisibility(R.id.tile_status, View.GONE)
      views.setViewVisibility(R.id.tile_detail, View.GONE)
      views.setProgressBar(R.id.tile_session_progress, 100, 0, false)
      views.setTextViewText(R.id.tile_timer_start, "0:00")
      views.setTextViewText(R.id.tile_timer_remaining, "0:00")
    }

    private fun bindPlaceholder(views: RemoteViews) {
      val date = WidgetDateLabel.format(null, null)
      views.setTextViewText(R.id.tile_title, "Lowalk")
      views.setTextViewText(R.id.tile_date_weekday, date.weekday)
      views.setTextViewText(R.id.tile_date_day, date.day)
      views.setTextViewText(R.id.tile_status, "Open Lowalk")
      views.setViewVisibility(R.id.tile_detail, View.GONE)
      views.setViewVisibility(R.id.tile_active_timer, View.GONE)
    }

    private fun bindActiveTimer(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
      timezoneId: String,
    ) {
      views.setViewVisibility(R.id.tile_active_timer, View.VISIBLE)
      views.setViewVisibility(R.id.tile_status, View.GONE)
      views.setViewVisibility(R.id.tile_detail, View.GONE)
      views.setProgressBar(
        R.id.tile_session_progress,
        100,
        WidgetSessionTimer.progressPercent(viewModel),
        false,
      )
      views.setTextViewText(
        R.id.tile_timer_start,
        WidgetSessionTimer.formatStartLabel(viewModel.sessionStartsAtMs, timezoneId),
      )
      views.setTextViewText(
        R.id.tile_timer_remaining,
        WidgetSessionTimer.formatRemainingCompact(WidgetSessionTimer.resolveRemainingMs(viewModel)),
      )
    }

    private fun bindStandardCopy(views: RemoteViews, copy: WidgetSimpleCopy.Copy) {
      views.setViewVisibility(R.id.tile_active_timer, View.GONE)

      if (copy.status.isNullOrBlank()) {
        views.setViewVisibility(R.id.tile_status, View.GONE)
      } else {
        views.setViewVisibility(R.id.tile_status, View.VISIBLE)
        views.setTextViewText(R.id.tile_status, copy.status)
      }

      if (copy.detail.isNullOrBlank()) {
        views.setViewVisibility(R.id.tile_detail, View.GONE)
      } else {
        views.setViewVisibility(R.id.tile_detail, View.VISIBLE)
        views.setTextViewText(R.id.tile_detail, copy.detail)
      }
    }

    private fun bindViewModel(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
      bundle: HeroWidgetStateEngine.ScheduleBundle,
    ) {
      val copy = WidgetSimpleCopy.resolve(viewModel)
      val date = WidgetDateLabel.format(bundle.todayIso, bundle.timezoneId)
      views.setTextViewText(R.id.tile_title, copy.title)
      views.setTextViewText(R.id.tile_date_weekday, date.weekday)
      views.setTextViewText(R.id.tile_date_day, date.day)

      if (viewModel.state == "active") {
        bindActiveTimer(views, viewModel, bundle.timezoneId)
        return
      }

      bindStandardCopy(views, copy)
    }
  }
}
