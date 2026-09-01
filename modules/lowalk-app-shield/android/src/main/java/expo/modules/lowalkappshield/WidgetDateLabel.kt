package expo.modules.lowalkappshield

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/** Cron-style widget date badge — short weekday + day number. */
object WidgetDateLabel {
  data class Parts(
    val weekday: String,
    val day: String,
  )

  fun format(todayIso: String?, timezoneId: String?): Parts {
    val tz = TimeZone.getTimeZone(timezoneId?.takeIf { it.isNotBlank() } ?: TimeZone.getDefault().id)
    val calendar =
      if (!todayIso.isNullOrBlank()) {
        parseIsoDate(todayIso, tz) ?: Calendar.getInstance(tz)
      } else {
        Calendar.getInstance(tz)
      }

    val weekday =
      SimpleDateFormat("EEE", Locale.US).apply { timeZone = tz }.format(calendar.time)
    val day = calendar.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
    return Parts(weekday = weekday, day = day)
  }

  private fun parseIsoDate(todayIso: String, tz: TimeZone): Calendar? {
    val parts = todayIso.split("-")
    if (parts.size != 3) return null
    val year = parts[0].toIntOrNull() ?: return null
    val month = parts[1].toIntOrNull() ?: return null
    val day = parts[2].toIntOrNull() ?: return null
    return Calendar.getInstance(tz).apply {
      set(Calendar.YEAR, year)
      set(Calendar.MONTH, month - 1)
      set(Calendar.DAY_OF_MONTH, day)
      set(Calendar.HOUR_OF_DAY, 12)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
  }
}
