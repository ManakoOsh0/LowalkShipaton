package expo.modules.lowalkappshield

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.graphics.PixelFormat

/**
 * Draws a full-screen focus shield over whatever app is currently open
 * (SYSTEM_ALERT_WINDOW). This is intentionally not a React Native Modal inside Lowalk.
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
    if (overlayView != null) return

    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val copy = ShieldOverlayContextStore.read(context)

    val root = ShieldOverlayUi.build(context, copy) {
      hide(context)
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
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
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
    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
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
