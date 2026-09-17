package expo.modules.lowalkappshield

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock

/** Schedules exact alarms at calendar shield transitions for offline app blocking. */
object ShieldAlarmScheduler {
  private const val ALARM_REQUEST_CODE = 42003
  private const val MIN_ALARM_DELAY_MS = 5_000L

  fun reschedule(context: Context) {
    val bundle = WidgetSessionStore.loadScheduleBundle(context)
    val packages = WidgetSessionStore.resolveBlockedPackageNames(context, bundle)
    if (bundle == null || packages.isEmpty()) {
      cancel(context)
      return
    }

    val nowMs = System.currentTimeMillis()
    val nextAt = ShieldScheduleEngine.collectShieldTransitionTimes(bundle, nowMs).firstOrNull()
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
    val intent = Intent(context, ShieldAlarmReceiver::class.java).apply {
      action = ShieldAlarmReceiver.ACTION_SHIELD_TICK
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag()
    return PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags)
  }

  private fun immutableFlag(): Int =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
}
