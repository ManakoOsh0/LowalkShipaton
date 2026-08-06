package expo.modules.lowalkappshield

import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager

/**
 * Draws a full-screen focus shield over whatever app is currently open
 * (SYSTEM_ALERT_WINDOW). Primary enforcement path on Android 10+.
 */
object AppShieldOverlayController {
  private var overlayView: View? = null

  fun canDrawOverlays(context: Context): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Settings.canDrawOverlays(context)
    } else {
      true
    }
  }

  fun show(context: Context, appLabel: String, onGoHome: () -> Unit) {
    if (!canDrawOverlays(context)) return

    val appContext = context.applicationContext
    if (overlayView != null) return

    val windowManager =
      appContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val copy = ShieldOverlayContextStore.read(appContext)

    val root = ShieldOverlayUi.build(appContext, copy, appLabel) {
      hide(appContext)
      onGoHome()
    }

    val type =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      } else {
        @Suppress("DEPRECATION")
        WindowManager.LayoutParams.TYPE_PHONE
      }

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      type,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
        WindowManager.LayoutParams.FLAG_FULLSCREEN or
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
      PixelFormat.OPAQUE,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = 0
      y = 0

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val windowMetrics = windowManager.currentWindowMetrics
        val systemBarInsets = windowMetrics.windowInsets.getInsetsIgnoringVisibility(
          WindowInsets.Type.systemBars(),
        )
        width = windowMetrics.bounds.width()
        height = windowMetrics.bounds.height() + systemBarInsets.top + systemBarInsets.bottom
        y = -systemBarInsets.top
        fitInsetsTypes = 0
      } else {
        @Suppress("DEPRECATION")
        val displayMetrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getRealMetrics(displayMetrics)
        width = displayMetrics.widthPixels
        height = displayMetrics.heightPixels
      }
    }

    try {
      windowManager.addView(root, params)
      overlayView = root
    } catch (_: Exception) {
      overlayView = null
    }
  }

  fun hide(context: Context) {
    val view = overlayView ?: return
    val appContext = context.applicationContext
    val windowManager =
      appContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    try {
      windowManager.removeView(view)
    } catch (_: Exception) {
      // Already removed.
    }
    overlayView = null
  }

  fun isShowing(): Boolean = overlayView != null

  fun openOverlaySettings(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
    val intent = Intent(
      Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      android.net.Uri.parse("package:${context.packageName}"),
    ).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }
}
