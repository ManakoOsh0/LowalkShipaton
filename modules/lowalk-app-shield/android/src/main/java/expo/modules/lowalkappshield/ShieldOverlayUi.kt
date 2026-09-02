package expo.modules.lowalkappshield

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

/** Shared full-screen shield layout — blocked-app headline and bottom Close pill. */
object ShieldOverlayUi {
  private const val DAWN_PATH_BACKGROUND = "#141210"
  private const val DAWN_PATH_FOREGROUND = "#F5F2ED"
  private const val CTA_BACKGROUND = "#FFFFFF"
  private const val CTA_TEXT = "#141210"
  /** Match constants/shieldOverlay.ts + ShieldBlockedIcon preview. */
  private const val LOGO_SIZE_DP = 124f
  private const val LOGO_OFFSET_X_DP = 6f
  private const val CONTENT_MAX_WIDTH_DP = 340f

  data class Copy(
    val nodeKind: String,
    val headline: String,
    val subtitle: String,
    val detail: String?,
    val ctaLabel: String,
  )

  fun build(
    context: Context,
    copy: Copy,
    blockedAppLabel: String? = null,
    onCtaClick: () -> Unit,
  ): View {
    val density = context.resources.displayMetrics.density
    val horizontalPad = (28 * density).toInt()
    val bottomInset = getBottomInset(context, density)

    val root = FrameLayout(context).apply {
      setBackgroundColor(Color.parseColor(DAWN_PATH_BACKGROUND))
      setPadding(horizontalPad, 0, horizontalPad, 0)
    }

    val content = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      layoutParams = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
      )
    }

    val centerStack = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        0,
        1f,
      )
    }

    val screenWidth = context.resources.displayMetrics.widthPixels
    val maxContentPx = (CONTENT_MAX_WIDTH_DP * density).toInt()
    val contentWidth = minOf(screenWidth - horizontalPad * 2, maxContentPx)

    val contentColumn = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      layoutParams = LinearLayout.LayoutParams(
        contentWidth,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      )
    }

    contentColumn.addView(buildLogoIcon(context, density))
    contentColumn.addView(
      titleText(context, resolveHeadline(copy, blockedAppLabel)).apply {
        layoutParams = LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply {
          topMargin = (28 * density).toInt()
        }
      },
    )
    contentColumn.addView(
      bodyText(context, copy.subtitle).apply {
        layoutParams = LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply {
          topMargin = (12 * density).toInt()
        }
      },
    )

    centerStack.addView(contentColumn)

    content.addView(centerStack)
    content.addView(
      buildCtaRow(context, density, copy, onCtaClick).apply {
        layoutParams = LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply {
          topMargin = (-24 * density).toInt()
          bottomMargin = bottomInset + (24 * density).toInt()
        }
      },
    )

    root.addView(content)
    return root
  }

  private fun resolveHeadline(copy: Copy, blockedAppLabel: String?): String {
    val label = blockedAppLabel?.trim().orEmpty()
    if (label.isNotBlank()) {
      return "$label blocked by Lowalk"
    }
    return copy.headline.ifBlank { "App blocked by Lowalk" }
  }

  private fun getBottomInset(context: Context, density: Float): Int {
    val resourceId = context.resources.getIdentifier("navigation_bar_height", "dimen", "android")
    val navBarPx =
      if (resourceId > 0) context.resources.getDimensionPixelSize(resourceId) else 0
    return navBarPx + (12 * density).toInt()
  }

  private fun buildLogoIcon(context: Context, density: Float): View {
    val iconSize = (LOGO_SIZE_DP * density).toInt()
    val wrapper = FrameLayout(context).apply {
      layoutParams = LinearLayout.LayoutParams(iconSize, iconSize)
      translationX = LOGO_OFFSET_X_DP * density
    }
    val image = ImageView(context).apply {
      setImageResource(R.drawable.lowal2_logo)
      scaleType = ImageView.ScaleType.FIT_XY
      layoutParams = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
      )
    }
    wrapper.addView(image)
    return wrapper
  }

  private fun displayBoldTypeface(context: Context): Typeface {
    return Typeface.DEFAULT_BOLD
  }

  private fun textRegularTypeface(context: Context): Typeface {
    return Typeface.DEFAULT
  }

  private fun titleText(context: Context, text: String): TextView {
    return TextView(context).apply {
      this.text = text
      setTextColor(Color.parseColor(DAWN_PATH_FOREGROUND))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
      typeface = displayBoldTypeface(context)
      gravity = Gravity.CENTER_HORIZONTAL
      setLineSpacing(0f, 1.1f)
    }
  }

  private fun bodyText(context: Context, text: String): TextView {
    return TextView(context).apply {
      this.text = text
      setTextColor(Color.parseColor(DAWN_PATH_FOREGROUND))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      typeface = textRegularTypeface(context)
      gravity = Gravity.CENTER_HORIZONTAL
      setLineSpacing(0f, 1.15f)
    }
  }

  private fun buildCtaRow(
    context: Context,
    density: Float,
    copy: Copy,
    onClick: () -> Unit,
  ): View {
    return LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_HORIZONTAL
      addView(buildCtaButton(context, density, copy, onClick))
    }
  }

  private fun buildCtaButton(
    context: Context,
    density: Float,
    copy: Copy,
    onClick: () -> Unit,
  ): View {
    val buttonBg = GradientDrawable().apply {
      cornerRadius = 999f * density
      setColor(Color.parseColor(CTA_BACKGROUND))
    }

    return TextView(context).apply {
      text = copy.ctaLabel.ifBlank { "Close" }
      setTextColor(Color.parseColor(CTA_TEXT))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
      typeface = Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER
      background = buttonBg
      minWidth = (260 * density).toInt()
      setPadding(
        (64 * density).toInt(),
        (16 * density).toInt(),
        (64 * density).toInt(),
        (16 * density).toInt(),
      )
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      )
      setOnClickListener { onClick() }
    }
  }
}
