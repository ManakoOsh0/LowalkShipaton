package expo.modules.lowalkappshield

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View

/**
 * Full-screen opaque shield fallback when overlay permission is unavailable.
 * Separate task in recents — used only when SYSTEM_ALERT_WINDOW is not granted.
 */
class ShieldActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    val dawnPathBackground = Color.parseColor("#141210")
    window.statusBarColor = dawnPathBackground
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      window.navigationBarColor = dawnPathBackground
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.setDecorFitsSystemWindows(false)
    }
    setContentView(buildContent())
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    recreate()
  }

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    // Never return to the blocked app — send user to Home.
    val home = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_HOME)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    startActivity(home)
  }

  private fun buildContent(): View {
    val blockedLabel = intent.getStringExtra(EXTRA_BLOCKED_LABEL).orEmpty()
    val copy = ShieldOverlayContextStore.read(this)
    return ShieldOverlayUi.build(this, copy, blockedLabel) {
      val home = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_HOME)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      startActivity(home)
      finish()
    }
  }

  companion object {
    const val EXTRA_BLOCKED_PACKAGE = "blocked_package"
    const val EXTRA_BLOCKED_LABEL = "blocked_label"

    fun launch(context: android.content.Context, packageName: String, appLabel: String) {
      val intent = Intent(context, ShieldActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        putExtra(EXTRA_BLOCKED_PACKAGE, packageName)
        putExtra(EXTRA_BLOCKED_LABEL, appLabel)
      }
      context.startActivity(intent)
    }
  }
}
