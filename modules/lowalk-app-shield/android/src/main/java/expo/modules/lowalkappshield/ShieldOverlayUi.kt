package expo.modules.lowalkappshield

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/** Shared black full-screen shield layout — matches the in-app BlockingOverlay design. */
object ShieldOverlayUi {
  private const val PRIMARY = "#6C4EF5"
  private const val CREAM = "#F0EDE9"

  data class Copy(
    val nodeKind: String,
    val subtitle: String,
    val ctaLabel: String,
  )

  fun build(
    context: Context,
    copy: Copy,
    onCtaClick: () -> Unit,
  ): View {
    val density = context.resources.displayMetrics.density

    val root = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.BLACK)
      gravity = Gravity.CENTER
      setPadding(
        (28 * density).toInt(),
        (48 * density).toInt(),
        (28 * density).toInt(),
        (48 * density).toInt(),
      )
    }

    val content = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      )
    }

    content.addView(buildMascotTile(context, copy.nodeKind, density))
    content.addView(
      titleText(context, "App Blocked", density).apply {
        setPadding(0, (32 * density).toInt(), 0, 0)
      },
    )

    val subtitleParts = copy.subtitle.split("\n", limit = 2)
    val headline = subtitleParts.firstOrNull().orEmpty()
    val timing = subtitleParts.getOrNull(1).orEmpty().trim()

    content.addView(
      bodyText(context, headline, density, bold = false).apply {
        setPadding(0, (12 * density).toInt(), 0, 0)
      },
    )

    if (timing.isNotEmpty()) {
      content.addView(
        bodyText(context, timing, density, bold = false, muted = true).apply {
          setPadding(0, (8 * density).toInt(), 0, 0)
        },
      )
    }

    content.addView(
      buildCtaButton(context, copy.ctaLabel, density, onCtaClick).apply {
        layoutParams = LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply {
          topMargin = (40 * density).toInt()
        }
      },
    )

    root.addView(content)
    return root
  }

  private fun kindTileLabel(kind: String): String =
    when (kind) {
      "class" -> "Class"
      "gym" -> "Gym"
      "library" -> "Library"
      else -> "Focus"
    }

  private fun buildMascotTile(context: Context, nodeKind: String, density: Float): View {
    val tileSize = (96 * density).toInt()
    val tileRadius = (22 * density)

    val tileBg = GradientDrawable().apply {
      cornerRadius = tileRadius
      setColor(Color.parseColor(PRIMARY))
    }

    val tile = FrameLayout(context).apply {
      layoutParams = LinearLayout.LayoutParams(tileSize, tileSize)
      background = tileBg
    }

    val labelView = TextView(context).apply {
      text = kindTileLabel(nodeKind)
      setTextColor(Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
      typeface = Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER
      layoutParams = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
        Gravity.CENTER,
      )
    }
    tile.addView(labelView)

    val badgeSize = (34 * density).toInt()
    val badgeBg = GradientDrawable().apply {
      shape = GradientDrawable.OVAL
      setColor(Color.WHITE)
      setStroke((3 * density).toInt(), Color.parseColor(PRIMARY))
    }

    val badge = TextView(context).apply {
      text = "🔒"
      gravity = Gravity.CENTER
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
      background = badgeBg
      layoutParams = FrameLayout.LayoutParams(badgeSize, badgeSize).apply {
        gravity = Gravity.TOP or Gravity.END
        topMargin = (-4 * density).toInt()
        marginEnd = (-4 * density).toInt()
      }
    }
    tile.addView(badge)

    return tile
  }

  private fun titleText(context: Context, text: String, density: Float): TextView {
    return TextView(context).apply {
      this.text = text
      setTextColor(Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 30f)
      typeface = Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER_HORIZONTAL
      setLineSpacing(0f, 1.1f)
    }
  }

  private fun bodyText(
    context: Context,
    text: String,
    density: Float,
    bold: Boolean,
    muted: Boolean = false,
  ): TextView {
    return TextView(context).apply {
      this.text = text
      setTextColor(if (muted) Color.parseColor("#9EFFFFFF") else Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, if (muted) 14f else 18f)
      typeface = if (bold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
      gravity = Gravity.CENTER_HORIZONTAL
      setLineSpacing(0f, 1.15f)
    }
  }

  private fun buildCtaButton(
    context: Context,
    label: String,
    density: Float,
    onClick: () -> Unit,
  ): TextView {
    val bg = GradientDrawable().apply {
      cornerRadius = 999f * density
      setColor(Color.parseColor(CREAM))
    }

    return TextView(context).apply {
      text = label
      setTextColor(Color.parseColor(PRIMARY))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 17f)
      typeface = Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER
      background = bg
      setPadding(
        (24 * density).toInt(),
        (18 * density).toInt(),
        (24 * density).toInt(),
        (18 * density).toInt(),
      )
      setOnClickListener { onClick() }
    }
  }
}
