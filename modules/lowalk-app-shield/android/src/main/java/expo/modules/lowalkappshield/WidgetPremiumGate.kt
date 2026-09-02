package expo.modules.lowalkappshield

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.view.View
import android.widget.RemoteViews

/** Shared PRO gate UI and paywall deep link for home-screen widgets. */
object WidgetPremiumGate {
  const val PAYWALL_DEEP_LINK = "trylowalk://paywall"

  fun applyLockedState(views: RemoteViews, overlayId: Int) {
    views.setViewVisibility(overlayId, View.VISIBLE)
  }

  fun applyUnlockedState(views: RemoteViews, overlayId: Int) {
    views.setViewVisibility(overlayId, View.GONE)
  }

  fun buildPaywallTapIntent(context: Context, requestCode: Int): PendingIntent {
    val intent =
      Intent(Intent.ACTION_VIEW, Uri.parse(PAYWALL_DEEP_LINK)).apply {
        setPackage(context.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag()
    return PendingIntent.getActivity(context, requestCode, intent, flags)
  }

  fun buildAppLaunchIntent(context: Context, requestCode: Int): PendingIntent {
    val launchIntent =
      context.packageManager.getLaunchIntentForPackage(context.packageName)
        ?: Intent(Intent.ACTION_MAIN).apply {
          addCategory(Intent.CATEGORY_LAUNCHER)
          setPackage(context.packageName)
        }
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag()
    return PendingIntent.getActivity(context, requestCode, launchIntent, flags)
  }

  private fun immutableFlag(): Int =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
}
