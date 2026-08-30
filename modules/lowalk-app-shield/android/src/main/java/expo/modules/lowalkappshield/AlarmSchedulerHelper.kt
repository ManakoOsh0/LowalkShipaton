package expo.modules.lowalkappshield

import android.app.AlarmManager
import android.app.PendingIntent
import android.os.Build

/** Shared alarm scheduling with exact-alarm permission fallback on Android 12+. */
object AlarmSchedulerHelper {
  fun scheduleElapsedWakeUp(
    alarmManager: AlarmManager,
    triggerAtElapsed: Long,
    pendingIntent: PendingIntent,
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
      alarmManager.setAndAllowWhileIdle(
        AlarmManager.ELAPSED_REALTIME_WAKEUP,
        triggerAtElapsed,
        pendingIntent,
      )
      return
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      alarmManager.setExactAndAllowWhileIdle(
        AlarmManager.ELAPSED_REALTIME_WAKEUP,
        triggerAtElapsed,
        pendingIntent,
      )
    } else {
      alarmManager.setExact(
        AlarmManager.ELAPSED_REALTIME_WAKEUP,
        triggerAtElapsed,
        pendingIntent,
      )
    }
  }
}
