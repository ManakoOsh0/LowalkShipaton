package expo.modules.lowalkappshield

import android.content.Context
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.widget.RemoteViews
import org.json.JSONObject
import kotlin.math.max

/** Resolved hero look from JS — applied to RemoteViews on each widget refresh. */
object HeroWidgetAppearance {
  data class Palette(
    val dashboardBg: Int,
    val frameShellTop: Int,
    val wellBg: Int,
    val plaque: Int,
    val ink: Int,
    val muted: Int,
    val mutedLight: Int,
    val accent: Int,
    val frameRadiusPx: Float,
    val wellRadiusPx: Float,
  )

  private fun parseColor(hex: String?, fallback: Int): Int {
    if (hex.isNullOrBlank()) return fallback
    return try {
      Color.parseColor(hex)
    } catch (_: IllegalArgumentException) {
      fallback
    }
  }

  private fun density(): Float = Resources.getSystem().displayMetrics.density

  private fun staticDefaults(): Palette {
    val density = density()
    return Palette(
      dashboardBg = Color.parseColor("#141210"),
      frameShellTop = Color.parseColor("#F4F4F1"),
      wellBg = Color.parseColor("#BABEB6"),
      plaque = Color.parseColor("#D0D4CB"),
      ink = Color.parseColor("#000000"),
      muted = Color.parseColor("#1A1A1A"),
      mutedLight = Color.parseColor("#3A3A3A"),
      accent = Color.parseColor("#F26430"),
      frameRadiusPx = 28f * density,
      wellRadiusPx = 20f * density,
    )
  }

  fun defaults(context: Context): Palette = staticDefaults()

  fun parse(json: JSONObject?): Palette {
    if (json == null) return staticDefaults()
    val fallback = staticDefaults()
    val density = density()
    return Palette(
      dashboardBg = parseColor(json.optString("dashboardBg"), fallback.dashboardBg),
      frameShellTop = parseColor(json.optString("frameShellTop"), fallback.frameShellTop),
      wellBg = parseColor(json.optString("wellBg"), fallback.wellBg),
      plaque = parseColor(json.optString("plaque"), fallback.plaque),
      ink = parseColor(json.optString("textPrimary"), fallback.ink),
      muted = parseColor(json.optString("textMuted"), fallback.muted),
      mutedLight = parseColor(json.optString("textMutedLight"), fallback.mutedLight),
      accent = parseColor(json.optString("accent"), fallback.accent),
      frameRadiusPx = density * json.optDouble("frameRadiusDp", 28.0).toFloat(),
      wellRadiusPx = density * json.optDouble("wellRadiusDp", 20.0).toFloat(),
    )
  }

  fun apply(context: Context, views: RemoteViews, palette: Palette) {
    val density = context.resources.displayMetrics.density
    val widgetWidthPx = (density * 320f).toInt().coerceAtLeast(1)
    val paperHeightPx = (density * 108f).toInt().coerceAtLeast(1)
    val wellHeightPx = (density * 72f).toInt().coerceAtLeast(1)

    views.setInt(R.id.widget_root, "setBackgroundColor", palette.dashboardBg)
    views.setImageViewBitmap(
      R.id.widget_paper_bg_image,
      roundedBitmap(widgetWidthPx, paperHeightPx, palette.frameShellTop, palette.frameRadiusPx),
    )
    views.setImageViewBitmap(
      R.id.widget_well_bg_image,
      roundedBitmap(widgetWidthPx, wellHeightPx, palette.wellBg, palette.wellRadiusPx),
    )

    val ruleColor = Color.argb(55, Color.red(palette.ink), Color.green(palette.ink), Color.blue(palette.ink))
    views.setInt(R.id.widget_rule, "setBackgroundColor", ruleColor)

    views.setTextColor(R.id.widget_meta_left, palette.ink)
    views.setTextColor(R.id.widget_meta_right, palette.ink)
    views.setTextColor(R.id.widget_session_title, palette.muted)
    views.setTextColor(R.id.widget_headline, palette.ink)
    views.setTextColor(R.id.widget_subline, palette.muted)
    views.setTextColor(R.id.widget_time_location, palette.muted)
    views.setTextColor(R.id.widget_travel, palette.mutedLight)
    views.setTextColor(R.id.widget_progress_start, palette.mutedLight)
    views.setTextColor(R.id.widget_progress_end, palette.mutedLight)
    views.setTextColor(R.id.widget_upcoming, palette.muted)
    views.setTextColor(R.id.widget_goal_label, palette.mutedLight)
    views.setTextColor(R.id.widget_blocked_label, palette.mutedLight)

    views.setInt(R.id.widget_meta_left, "setBackgroundColor", palette.plaque)
    views.setInt(R.id.widget_meta_right, "setBackgroundColor", palette.plaque)
  }

  private fun roundedBitmap(
    widthPx: Int,
    heightPx: Int,
    color: Int,
    radiusPx: Float,
  ): Bitmap {
    val safeWidth = max(widthPx, 1)
    val safeHeight = max(heightPx, 1)
    val bitmap = Bitmap.createBitmap(safeWidth, safeHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color }
    val rect = RectF(0f, 0f, safeWidth.toFloat(), safeHeight.toFloat())
    canvas.drawRoundRect(rect, radiusPx, radiusPx, paint)
    return bitmap
  }
}
