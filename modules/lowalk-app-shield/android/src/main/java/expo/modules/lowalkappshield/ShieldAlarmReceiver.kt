package expo.modules.lowalkappshield

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Fires at calendar shield transitions to start/stop blocking without opening Lowalk. */
class ShieldAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != ACTION_SHIELD_TICK) return
    ShieldOrchestrator.sync(context)
  }

  companion object {
    const val ACTION_SHIELD_TICK = "expo.modules.lowalkappshield.action.SHIELD_TICK"
  }
}
