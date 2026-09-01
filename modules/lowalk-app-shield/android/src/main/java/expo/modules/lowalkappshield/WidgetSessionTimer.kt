package expo.modules.lowalkappshield

import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import kotlin.math.ceil
import kotlin.math.max

/** Active-session timer row — session start clock + compact remaining. */
object WidgetSessionTimer {
  fun formatStartLabel(startMs: Long?, timezoneId: String?): String {
    if (startMs == null) return "--:--"
    val tz = TimeZone.getTimeZone(timezoneId?.takeIf { it.isNotBlank() } ?: TimeZone.getDefault().id)
    val calendar = Calendar.getInstance(tz).apply { timeInMillis = startMs }
    return String.format(
      Locale.US,
      "%d:%02d",
      calendar.get(Calendar.HOUR_OF_DAY),
      calendar.get(Calendar.MINUTE),
    )
  }

  /** Compact H:MM remaining — e.g. 1:37, 0:41 (not mm:ss). */
  fun formatRemainingCompact(remainingMs: Long): String {
    val totalMinutes = max(0L, ceil(remainingMs / 60_000.0).toLong())
    val hours = totalMinutes / 60
    val minutes = totalMinutes % 60
    return if (hours > 0) {
      String.format(Locale.US, "%d:%02d", hours, minutes)
    } else {
      String.format(Locale.US, "0:%02d", minutes)
    }
  }

  fun resolveRemainingMs(viewModel: HeroWidgetStateEngine.ViewModel): Long {
    viewModel.timerRemainingMs?.let { return max(0L, it) }
    val endsAt = viewModel.sessionEndsAtMs ?: return 0L
    return max(0L, endsAt - System.currentTimeMillis())
  }

  fun progressPercent(viewModel: HeroWidgetStateEngine.ViewModel): Int {
    val ratio = viewModel.progressRatio ?: 0f
    return (ratio.coerceIn(0f, 1f) * 100f).toInt()
  }
}
