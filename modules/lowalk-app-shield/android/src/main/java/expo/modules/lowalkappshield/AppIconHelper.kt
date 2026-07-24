package expo.modules.lowalkappshield

import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream

/** Renders launcher icons as base64 PNGs for the React Native Image component. */
internal object AppIconHelper {
  private const val ICON_SIZE_PX = 96

  fun iconBase64ForPackage(pm: PackageManager, packageName: String): String? {
    return try {
      val drawable = pm.getApplicationIcon(packageName)
      val bitmap = drawableToBitmap(drawable) ?: return null
      val scaled = Bitmap.createScaledBitmap(bitmap, ICON_SIZE_PX, ICON_SIZE_PX, true)
      val stream = ByteArrayOutputStream()
      scaled.compress(Bitmap.CompressFormat.PNG, 92, stream)
      Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    } catch (_: PackageManager.NameNotFoundException) {
      null
    } catch (_: Exception) {
      null
    }
  }

  private fun drawableToBitmap(drawable: Drawable): Bitmap? {
    if (drawable is BitmapDrawable) {
      val bitmap = drawable.bitmap
      if (bitmap != null) return bitmap
    }

    val width = drawable.intrinsicWidth.coerceAtLeast(ICON_SIZE_PX)
    val height = drawable.intrinsicHeight.coerceAtLeast(ICON_SIZE_PX)
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, canvas.width, canvas.height)
    drawable.draw(canvas)
    return bitmap
  }
}
