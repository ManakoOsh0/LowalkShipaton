package expo.modules.lowalkappshield

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.view.View
import android.widget.RemoteViews
import java.util.Locale
import java.util.concurrent.TimeUnit
import kotlin.math.max

/** Home screen widget mirroring the in-app Hero Card session status. */
class HeroWidgetProvider : android.appwidget.AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (id in appWidgetIds) {
      updateWidget(context, appWidgetManager, id)
    }
    HeroWidgetAlarmScheduler.reschedule(context)
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
      HeroWidgetAlarmScheduler.reschedule(context)
    }
  }

  override fun onDisabled(context: Context) {
    HeroWidgetAlarmScheduler.cancel(context)
    super.onDisabled(context)
  }

  companion object {
    const val ACTION_WIDGET_TICK = "expo.modules.lowalkappshield.action.WIDGET_TICK"
    private const val TAP_REQUEST_CODE = 42002

    fun updateWidget(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetId: Int,
    ) {
      val viewModel = WidgetSessionStore.loadViewModel(context)
      val views = RemoteViews(context.packageName, R.layout.widget_hero)
      if (viewModel != null) {
        bindViewModel(views, viewModel)
      } else {
        bindPlaceholder(views)
      }
      val tapIntent = buildTapIntent(context)
      views.setOnClickPendingIntent(R.id.widget_root, tapIntent)
      appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun bindPlaceholder(views: RemoteViews) {
      views.setTextViewText(R.id.widget_meta_left, "FOCUS")
      views.setTextViewText(R.id.widget_meta_right, "TODAY")
      views.setTextViewText(R.id.widget_session_title, "Lowalk")
      views.setTextViewText(R.id.widget_headline, "Open Lowalk")
      views.setViewVisibility(R.id.widget_subline, View.GONE)
      views.setViewVisibility(R.id.widget_time_location, View.GONE)
      views.setViewVisibility(R.id.widget_travel, View.GONE)
      views.setViewVisibility(R.id.widget_progress_row, View.GONE)
      views.setViewVisibility(R.id.widget_upcoming, View.GONE)
      views.setViewVisibility(R.id.widget_goal_label, View.GONE)
      views.setViewVisibility(R.id.widget_blocked_label, View.GONE)
    }

    private fun bindViewModel(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
    ) {
      views.setTextViewText(R.id.widget_meta_left, viewModel.metaLeft.uppercase(Locale.US))
      views.setTextViewText(R.id.widget_meta_right, resolveStatusChip(viewModel))

      views.setTextViewText(R.id.widget_session_title, viewModel.sessionTitle)
      views.setTextViewText(R.id.widget_headline, resolveHeadline(viewModel))

      bindDetailLine(views, viewModel)
      bindTimeLocationRow(views, viewModel)
      bindTravelRow(views, viewModel)
      bindProgressRow(views, viewModel)
      bindUpNextFooter(views, viewModel)
      bindGoalLabel(views, viewModel)
      bindBlockedLabel(views, viewModel)
    }

    private fun resolveStatusChip(viewModel: HeroWidgetStateEngine.ViewModel): String {
      when (viewModel.state) {
        "active" -> return "LIVE"
        "up_next" -> return formatUpNextStatus(viewModel.headline)
        "on_the_way" -> return viewModel.metaRight.uppercase(Locale.US)
        "weekly_report" -> return viewModel.metaRight.uppercase(Locale.US)
        else -> return viewModel.metaRight.uppercase(Locale.US)
      }
    }

    private fun formatUpNextStatus(headline: String): String {
      val minuteMatch = Regex("""(\d+)\s*minute""", RegexOption.IGNORE_CASE).find(headline)
      if (minuteMatch != null) {
        return "IN ${minuteMatch.groupValues[1]}M"
      }
      val hourMatch = Regex("""(\d+)\s*h""", RegexOption.IGNORE_CASE).find(headline)
      if (hourMatch != null) {
        return "IN ${hourMatch.groupValues[1]}H"
      }
      if (headline.contains("now", ignoreCase = true)) {
        return "NOW"
      }
      return "UP NEXT"
    }

    private fun bindDetailLine(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
    ) {
      val detail = resolveDetailLine(viewModel)
      if (detail.isNullOrBlank()) {
        views.setViewVisibility(R.id.widget_subline, View.GONE)
      } else {
        views.setViewVisibility(R.id.widget_subline, View.VISIBLE)
        views.setTextViewText(R.id.widget_subline, detail)
      }
    }

    private fun resolveDetailLine(viewModel: HeroWidgetStateEngine.ViewModel): String? {
      if (!viewModel.subline.isNullOrBlank()) {
        val location = viewModel.locationLabel
        if (
          location != null &&
          viewModel.subline.equals(location, ignoreCase = true)
        ) {
          return null
        }
        return viewModel.subline
      }
      if (viewModel.state == "weekly_report" && viewModel.dailyGoalTarget <= 0) {
        return "No sessions today"
      }
      return null
    }

    private fun bindTimeLocationRow(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
    ) {
      val row = buildTimeLocationRow(viewModel)
      if (row.isNullOrBlank()) {
        views.setViewVisibility(R.id.widget_time_location, View.GONE)
      } else {
        views.setViewVisibility(R.id.widget_time_location, View.VISIBLE)
        views.setTextViewText(R.id.widget_time_location, row)
      }
    }

    private fun buildTimeLocationRow(viewModel: HeroWidgetStateEngine.ViewModel): String? {
      val time = viewModel.timeWindowLabel?.trim().orEmpty()
      val location = viewModel.locationLabel?.trim().orEmpty()
      return when {
        time.isNotEmpty() && location.isNotEmpty() -> "$time · $location"
        time.isNotEmpty() -> time
        location.isNotEmpty() -> location
        else -> null
      }
    }

    private fun bindTravelRow(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
    ) {
      val travel = viewModel.travelLabel?.trim().orEmpty()
      if (travel.isEmpty()) {
        views.setViewVisibility(R.id.widget_travel, View.GONE)
      } else {
        views.setViewVisibility(R.id.widget_travel, View.VISIBLE)
        views.setTextViewText(R.id.widget_travel, travel)
      }
    }

    private fun bindProgressRow(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
    ) {
      val progressPercent = resolveProgressPercent(viewModel)
      if (progressPercent == null) {
        views.setViewVisibility(R.id.widget_progress_row, View.GONE)
        return
      }

      views.setViewVisibility(R.id.widget_progress_row, View.VISIBLE)
      views.setProgressBar(R.id.widget_progress, 100, progressPercent, false)

      val startLabel = viewModel.progressStartLabel
      val endLabel = viewModel.progressEndLabel
      if (startLabel.isNullOrBlank() || endLabel.isNullOrBlank()) {
        views.setViewVisibility(R.id.widget_progress_start, View.GONE)
        views.setViewVisibility(R.id.widget_progress_end, View.GONE)
      } else {
        views.setViewVisibility(R.id.widget_progress_start, View.VISIBLE)
        views.setViewVisibility(R.id.widget_progress_end, View.VISIBLE)
        views.setTextViewText(R.id.widget_progress_start, startLabel)
        views.setTextViewText(R.id.widget_progress_end, endLabel)
      }
    }

    private fun bindUpNextFooter(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
    ) {
      val footer = viewModel.upNextFooter?.trim().orEmpty()
      if (footer.isEmpty() || viewModel.state == "active") {
        views.setViewVisibility(R.id.widget_upcoming, View.GONE)
        return
      }
      views.setViewVisibility(R.id.widget_upcoming, View.VISIBLE)
      views.setTextViewText(R.id.widget_upcoming, footer)
    }

    private fun bindGoalLabel(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
    ) {
      val goalLabel = buildGoalLabel(viewModel)
      if (goalLabel.isNullOrBlank()) {
        views.setViewVisibility(R.id.widget_goal_label, View.GONE)
      } else {
        views.setViewVisibility(R.id.widget_goal_label, View.VISIBLE)
        views.setTextViewText(R.id.widget_goal_label, goalLabel)
      }
    }

    private fun bindBlockedLabel(
      views: RemoteViews,
      viewModel: HeroWidgetStateEngine.ViewModel,
    ) {
      if (viewModel.blockedAppsLabel.isNullOrBlank()) {
        views.setViewVisibility(R.id.widget_blocked_label, View.GONE)
      } else {
        views.setViewVisibility(R.id.widget_blocked_label, View.VISIBLE)
        views.setTextViewText(R.id.widget_blocked_label, viewModel.blockedAppsLabel)
      }
    }

    private fun resolveHeadline(viewModel: HeroWidgetStateEngine.ViewModel): String {
      if (viewModel.state == "active") {
        val countdown = viewModel.countdownLabel?.trim().orEmpty()
        if (countdown.isNotEmpty()) return countdown
        val endsAt = viewModel.sessionEndsAtMs
        if (endsAt != null) {
          val remainingMs = max(0L, endsAt - System.currentTimeMillis())
          return formatCountdown(remainingMs)
        }
      }
      return viewModel.headline.ifBlank { viewModel.sessionTitle }
    }

    private fun resolveProgressPercent(viewModel: HeroWidgetStateEngine.ViewModel): Int? {
      viewModel.progressRatio?.let { ratio ->
        return (ratio.coerceIn(0f, 1f) * 100f).toInt()
      }
      if (viewModel.state == "active") {
        val startsAt = viewModel.sessionStartsAtMs
        val endsAt = viewModel.sessionEndsAtMs
        if (startsAt != null && endsAt != null && endsAt > startsAt) {
          val nowMs = System.currentTimeMillis()
          val totalMs = endsAt - startsAt
          val elapsedMs = (nowMs - startsAt).coerceIn(0L, totalMs)
          return ((elapsedMs.toFloat() / totalMs.toFloat()) * 100f).toInt().coerceIn(0, 100)
        }
        val fallbackEndsAt = endsAt ?: return null
        val remainingMs = max(0L, fallbackEndsAt - System.currentTimeMillis())
        val totalMs = 60 * 60 * 1000L
        val elapsed = totalMs - remainingMs
        return ((elapsed.toFloat() / totalMs.toFloat()) * 100f).toInt().coerceIn(0, 100)
      }
      if (viewModel.dailyGoalTarget > 0 && viewModel.state == "weekly_report") {
        val ratio = viewModel.dailyGoalCompleted.toFloat() / viewModel.dailyGoalTarget.toFloat()
        return (ratio.coerceIn(0f, 1f) * 100f).toInt()
      }
      return null
    }

    private fun buildGoalLabel(viewModel: HeroWidgetStateEngine.ViewModel): String? {
      if (viewModel.state == "active") return null
      if (viewModel.dailyGoalTarget <= 0) return null
      return "${viewModel.dailyGoalCompleted} / ${viewModel.dailyGoalTarget} sessions today"
    }

    private fun formatCountdown(remainingMs: Long): String {
      val totalSeconds = TimeUnit.MILLISECONDS.toSeconds(remainingMs)
      val hours = totalSeconds / 3600
      val minutes = (totalSeconds % 3600) / 60
      val seconds = totalSeconds % 60
      return if (hours > 0) {
        String.format(Locale.US, "%d:%02d:%02d", hours, minutes, seconds)
      } else {
        String.format(Locale.US, "%02d:%02d", minutes, seconds)
      }
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
