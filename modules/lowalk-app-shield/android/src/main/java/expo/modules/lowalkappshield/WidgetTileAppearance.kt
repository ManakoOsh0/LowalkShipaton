package expo.modules.lowalkappshield

import android.content.Context
import android.graphics.Color
import android.os.Build
import android.widget.RemoteViews
import org.json.JSONObject

/** Fixed neutral palette for home-screen widgets. */
object WidgetTileAppearance {
  data class Palette(
    val tileBg: Int,
    val textPrimary: Int,
    val textMuted: Int,
    val dateAccent: Int,
  )

  private fun staticDefaults(): Palette {
    return Palette(
      tileBg = Color.parseColor("#DEDEDE"),
      textPrimary = Color.parseColor("#1C1C1E"),
      textMuted = Color.parseColor("#636366"),
      dateAccent = Color.parseColor("#FF8A3D"),
    )
  }

  fun defaults(context: Context): Palette = staticDefaults()

  fun parse(json: JSONObject?): Palette {
    if (json == null) return staticDefaults()
    val fallback = staticDefaults()
    return Palette(
      tileBg = parseCssColor(json.optString("tileBg"), fallback.tileBg),
      textPrimary = parseCssColor(json.optString("textPrimary"), fallback.textPrimary),
      textMuted = parseCssColor(json.optString("textMuted"), fallback.textMuted),
      dateAccent = parseCssColor(json.optString("dateAccent"), fallback.dateAccent),
    )
  }

  fun applyFocusTile(views: RemoteViews, palette: Palette) {
    views.setInt(R.id.widget_root, "setBackgroundColor", palette.tileBg)
    views.setTextColor(R.id.tile_title, palette.textPrimary)
    views.setTextColor(R.id.tile_status, palette.textPrimary)
    views.setTextColor(R.id.tile_detail, palette.textMuted)
    views.setTextColor(R.id.tile_date_weekday, palette.textPrimary)
    views.setTextColor(R.id.tile_date_day, palette.dateAccent)
    views.setTextColor(R.id.tile_timer_start, palette.textPrimary)
    views.setTextColor(R.id.tile_timer_remaining, palette.textPrimary)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      views.setViewOutlinePreferredCornersRadius(
        R.id.widget_root,
        48f,
        48f,
        48f,
        48f,
      )
    }
  }

  fun applyHoursTile(views: RemoteViews, palette: Palette) {
    views.setInt(R.id.focus_hours_root, "setBackgroundColor", palette.tileBg)
    views.setTextColor(R.id.focus_hours_value, palette.textPrimary)
    views.setTextColor(R.id.focus_hours_label, palette.textMuted)
    views.setInt(R.id.focus_hours_hourglass, "setColorFilter", palette.textMuted)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      views.setViewOutlinePreferredCornersRadius(
        R.id.focus_hours_root,
        48f,
        48f,
        48f,
        48f,
      )
    }
  }

  private val rgbaPattern =
    Regex("""rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)""")

  private fun parseCssColor(value: String?, fallback: Int): Int {
    if (value.isNullOrBlank()) return fallback
    return try {
      Color.parseColor(value.trim())
    } catch (_: IllegalArgumentException) {
      parseRgba(value.trim()) ?: fallback
    }
  }

  private fun parseRgba(value: String): Int? {
    val match = rgbaPattern.matchEntire(value) ?: return null
    val alpha = (match.groupValues[4].toFloat() * 255f).toInt().coerceIn(0, 255)
    val red = match.groupValues[1].toInt().coerceIn(0, 255)
    val green = match.groupValues[2].toInt().coerceIn(0, 255)
    val blue = match.groupValues[3].toInt().coerceIn(0, 255)
    return Color.argb(alpha, red, green, blue)
  }
}
