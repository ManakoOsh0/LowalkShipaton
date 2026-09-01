package expo.modules.lowalkappshield

import android.content.Context
import android.util.Log
import android.widget.RemoteViews

/** Builds RemoteViews using runtime resource lookup so merged APK layouts resolve reliably. */
object WidgetLayouts {
  private const val TAG = "WidgetLayouts"

  fun remoteViews(context: Context, layoutName: String): RemoteViews? {
    val packageName = context.packageName
    val layoutId =
      context.resources.getIdentifier(layoutName, "layout", packageName)
    if (layoutId == 0) {
      Log.e(TAG, "Missing widget layout $layoutName in package $packageName")
      return null
    }
    return RemoteViews(packageName, layoutId)
  }
}
