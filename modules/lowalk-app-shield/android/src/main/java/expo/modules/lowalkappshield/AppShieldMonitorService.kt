package expo.modules.lowalkappshield

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

/**
 * Foreground UsageStats monitor — launches ShieldActivity when a blocked app opens.
 * Persists lock state so swiping Lowalk from recents does not end enforcement.
 */
class AppShieldMonitorService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var blockedPackages: Set<String> = emptySet()
  private var shieldEndsAtMs: Long = 0L
  private var lastBlockedPackage: String? = null

  private val pollRunnable = object : Runnable {
    override fun run() {
      pollOnce()
      handler.postDelayed(this, POLL_INTERVAL_MS)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopMonitoring(clearPersisted = true)
        stopSelf()
        return START_NOT_STICKY
      }
      else -> {
        val fromIntent = intent?.getStringArrayListExtra(EXTRA_PACKAGES).orEmpty()
        if (fromIntent.isNotEmpty()) {
          blockedPackages = fromIntent.map { it.trim() }.filter { it.isNotEmpty() }.toSet()
          shieldEndsAtMs = intent?.getLongExtra(EXTRA_SHIELD_ENDS_AT_MS, 0L) ?: 0L
          persistState()
        } else {
          hydrateFromPrefs()
        }

        if (isShieldExpired()) {
          stopMonitoring(clearPersisted = true)
          stopSelf()
          return START_NOT_STICKY
        }

        if (blockedPackages.isEmpty()) {
          stopMonitoring(clearPersisted = true)
          stopSelf()
          return START_NOT_STICKY
        }

        startAsForeground()
        handler.removeCallbacks(pollRunnable)
        handler.post(pollRunnable)
      }
    }
    return START_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    super.onTaskRemoved(rootIntent)
    hydrateFromPrefs()
    if (blockedPackages.isNotEmpty() && !isShieldExpired()) {
      start(applicationContext, blockedPackages.toList(), shieldEndsAtMs)
    }
  }

  override fun onDestroy() {
    handler.removeCallbacks(pollRunnable)
    AppShieldOverlayController.hide(this)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    super.onDestroy()
  }

  private fun isShieldExpired(): Boolean {
    return shieldEndsAtMs > 0L && System.currentTimeMillis() >= shieldEndsAtMs
  }

  private fun persistState() {
    prefs(this).edit()
      .putStringSet(PREF_PACKAGES, blockedPackages)
      .putLong(PREF_SHIELD_ENDS_AT_MS, shieldEndsAtMs)
      .putBoolean(PREF_MONITORING_ACTIVE, blockedPackages.isNotEmpty())
      .apply()
  }

  private fun hydrateFromPrefs() {
    val stored = prefs(this)
    blockedPackages = stored.getStringSet(PREF_PACKAGES, emptySet())?.toSet() ?: emptySet()
    shieldEndsAtMs = stored.getLong(PREF_SHIELD_ENDS_AT_MS, 0L)
  }

  private fun stopMonitoring(clearPersisted: Boolean) {
    handler.removeCallbacks(pollRunnable)
    AppShieldOverlayController.hide(this)
    if (clearPersisted) {
      ShieldOverlayContextStore.clear(this)
      prefs(this).edit()
        .remove(PREF_PACKAGES)
        .remove(PREF_SHIELD_ENDS_AT_MS)
        .putBoolean(PREF_MONITORING_ACTIVE, false)
        .apply()
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
  }

  private fun startAsForeground() {
    ensureChannel()
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val pending = PendingIntent.getActivity(
      this,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    // Group summary for enforcement FGS — pre-buffer alerts use a separate expo-notifications channel.
    val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Lowalk session")
      .setContentText("Apps blocked in the background.")
      .setSmallIcon(R.drawable.ic_notification)
      .setColor(0xFFFF7700.toInt())
      .setContentIntent(pending)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setShowWhen(false)
      .setSilent(true)
      .setPriority(NotificationCompat.PRIORITY_MIN)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setGroup(SESSION_STATUS_GROUP)
      .setGroupSummary(true)
      .setSortKey("1")
      .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Session status",
      NotificationManager.IMPORTANCE_MIN,
    ).apply {
      description =
        "Keeps app blocking active. Pre-buffer and session reminders use Session reminders."
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun clearBlockedShield() {
    AppShieldOverlayController.hide(this)
    lastBlockedPackage = null
  }

  private fun pollOnce() {
    if (blockedPackages.isEmpty()) return

    if (isShieldExpired()) {
      stopMonitoring(clearPersisted = true)
      stopSelf()
      return
    }

    if (!AppShieldPermissionHelper.hasUsageStatsPermission(this)) return

    val foreground = AppShieldPermissionHelper.queryForegroundPackage(this) ?: return

    if (foreground == packageName) {
      clearBlockedShield()
      return
    }

    if (!blockedPackages.contains(foreground)) {
      clearBlockedShield()
      return
    }

    if (lastBlockedPackage == foreground) {
      return
    }

    lastBlockedPackage = foreground
    ShieldActivity.launch(this, foreground, resolveLabel(foreground))
  }

  private fun resolveLabel(packageName: String): String {
    return try {
      val info = packageManager.getApplicationInfo(packageName, 0)
      packageManager.getApplicationLabel(info).toString()
    } catch (_: PackageManager.NameNotFoundException) {
      packageName
    }
  }

  companion object {
    const val ACTION_START = "expo.modules.lowalkappshield.START"
    const val ACTION_STOP = "expo.modules.lowalkappshield.STOP"
    const val EXTRA_PACKAGES = "packages"
    const val EXTRA_SHIELD_ENDS_AT_MS = "shield_ends_at_ms"

    private const val CHANNEL_ID = "lowalk_session_status"
    private const val SESSION_STATUS_GROUP = "lowalk_session_status"
    private const val NOTIFICATION_ID = 7142
    private const val POLL_INTERVAL_MS = 500L
    private const val PREF_NAME = "lowalk_app_shield"
    private const val PREF_PACKAGES = "blocked_packages"
    private const val PREF_SHIELD_ENDS_AT_MS = "shield_ends_at_ms"
    private const val PREF_MONITORING_ACTIVE = "monitoring_active"

    fun prefs(context: Context) =
      context.applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun isMonitoringActive(context: Context): Boolean {
      return prefs(context).getBoolean(PREF_MONITORING_ACTIVE, false)
    }

    fun start(context: Context, packages: List<String>, shieldEndsAtMs: Long) {
      val intent = Intent(context, AppShieldMonitorService::class.java).apply {
        action = ACTION_START
        putStringArrayListExtra(EXTRA_PACKAGES, ArrayList(packages))
        putExtra(EXTRA_SHIELD_ENDS_AT_MS, shieldEndsAtMs)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      val intent = Intent(context, AppShieldMonitorService::class.java).apply {
        action = ACTION_STOP
      }
      context.startService(intent)
    }
  }
}

internal object AppShieldPermissionHelper {
  fun hasUsageStatsPermission(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
    val mode = appOps.checkOpNoThrow(
      android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
      android.os.Process.myUid(),
      context.packageName,
    )
    return mode == android.app.AppOpsManager.MODE_ALLOWED
  }

  fun queryForegroundPackage(context: Context): String? {
    val usageStatsManager =
      context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val end = System.currentTimeMillis()
    val begin = end - 8_000L

    val stats = usageStatsManager.queryUsageStats(
      UsageStatsManager.INTERVAL_BEST,
      begin,
      end,
    )
    val fromStats = stats
      ?.filter { it.lastTimeUsed >= begin }
      ?.maxByOrNull { it.lastTimeUsed }
      ?.packageName

    if (!fromStats.isNullOrBlank()) {
      return fromStats
    }

    val events = usageStatsManager.queryEvents(begin, end)
    val event = UsageEvents.Event()
    var latestPackage: String? = null
    var latestTimestamp = 0L

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val isForeground =
        event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND ||
          (Build.VERSION.SDK_INT >= 29 &&
            event.eventType == UsageEvents.Event.ACTIVITY_RESUMED)
      if (isForeground && event.timeStamp >= latestTimestamp) {
        latestTimestamp = event.timeStamp
        latestPackage = event.packageName
      }
    }

    return latestPackage
  }
}
