package expo.modules.lowalkappshield

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Reschedules hero widget alarms after reboot or timezone changes. */
class HeroWidgetBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    when (intent?.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_TIMEZONE_CHANGED,
      Intent.ACTION_TIME_CHANGED,
      -> {
        WidgetSessionStore.requestWidgetRefresh(context)
        HeroWidgetAlarmScheduler.reschedule(context)
        ShieldOrchestrator.sync(context)
      }
    }
  }
}
