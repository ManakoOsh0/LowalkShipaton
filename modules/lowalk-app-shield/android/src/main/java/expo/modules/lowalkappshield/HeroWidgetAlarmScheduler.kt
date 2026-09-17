package expo.modules.lowalkappshield

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock

/** Shared tick alarm for every placed home-screen widget. */
object HeroWidgetAlarmScheduler {
  private const val ALARM_REQUEST_CODE = 42001
  private const val CLOCK_TICK_MS = 60_000L
  private const val MIN_ALARM_DELAY_MS = 5_000L

  fun reschedule(context: Context) {
    if (!WidgetSessionStore.hasPlacedWidgets(context)) {
      cancel(context)
      return
    }

    val bundle = WidgetSessionStore.loadScheduleBundle(context) ?: run {
      cancel(context)
      return
    }

    val nowMs = System.currentTimeMillis()
    val viewModel = HeroWidgetStateEngine.compute(bundle, nowMs)
    val transitions = HeroWidgetStateEngine.collectTransitionTimes(bundle, nowMs).toMutableList()
    viewModel.nextTransitionAtMs?.let { transitions.add(it) }

    if (HeroWidgetStateEngine.needsClockTick(viewModel, nowMs)) {
      transitions.add(nowMs + CLOCK_TICK_MS)
    }

    val nextAt = transitions.filter { it > nowMs }.minOrNull()
    if (nextAt == null) {
      cancel(context)
      return
    }

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pendingIntent = buildTickPendingIntent(context)
    val triggerAt = SystemClock.elapsedRealtime() + maxOf(nextAt - nowMs, MIN_ALARM_DELAY_MS)

    AlarmSchedulerHelper.scheduleElapsedWakeUp(alarmManager, triggerAt, pendingIntent)
  }

  fun cancel(context: Context) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.cancel(buildTickPendingIntent(context))
  }

  private fun buildTickPendingIntent(context: Context): PendingIntent {
    val intent = Intent(context, HeroWidgetProvider::class.java).apply {
      action = HeroWidgetProvider.ACTION_WIDGET_TICK
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag()
    return PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags)
  }

  private fun immutableFlag(): Int =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
}
