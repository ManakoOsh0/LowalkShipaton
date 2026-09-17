package expo.modules.lowalkappshield

import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.math.min

/** Offline hero widget state derived from synced schedule + wall clock. */
object HeroWidgetStateEngine {
  data class IntelCell(val label: String, val value: String)

  data class UpcomingRow(
    val timeLabel: String,
    val title: String,
    val locationLabel: String,
  )

  data class FocusNode(
    val id: String,
    val title: String,
    val kind: String,
    val scheduleType: String,
    val weekday: Int,
    val startMinutes: Int,
    val endMinutes: Int,
    val locationLabel: String?,
    val completedToday: Boolean,
    val skippedToday: Boolean,
  ) {
    fun isOpenToday(bundleWeekday: Int): Boolean =
      weekday == bundleWeekday && !completedToday && !skippedToday
  }

  data class ActiveSession(
    val nodeId: String,
    val nodeTitle: String,
    val zoneLabel: String,
    val scheduleType: String,
    val shieldStartsAtMs: Long,
    val endsAtMs: Long,
    val presenceVerified: Boolean,
    val requiredOnSiteMs: Long?,
    val onSiteAccumulatedMs: Long,
    val awaySinceMs: Long?,
    val penaltyShieldEndsAtMs: Long?,
    val penaltyMinutes: Int?,
  )

  data class ScheduleBundle(
    val syncedAtMs: Long,
    val timezoneId: String,
    val classPreBufferMinutes: Int,
    val sessionGapMergeMinutes: Int,
    val dailyGoalCompleted: Int,
    val dailyGoalTarget: Int,
    val blockedAppsCount: Int,
    val blockedPackageNames: List<String>,
    /** Estimated lifetime focus minutes synced from JS. */
    val totalFocusMinutes: Int,
    val todayIso: String,
    val todayWeekday: Int,
    val nodes: List<FocusNode>,
    val activeSession: ActiveSession?,
    val display: WidgetSessionStore.Snapshot,
    val intelCells: List<IntelCell>,
    val upcomingToday: List<UpcomingRow>,
    val appearance: WidgetTileAppearance.Palette,
  )

  data class ViewModel(
    val state: String,
    val sessionTitle: String,
    val metaLeft: String,
    val metaRight: String,
    val headline: String,
    val subline: String?,
    val countdownLabel: String?,
    val progressRatio: Float?,
    val dailyGoalCompleted: Int,
    val dailyGoalTarget: Int,
    val sessionStartsAtMs: Long?,
    val sessionEndsAtMs: Long?,
    val timeWindowLabel: String?,
    val locationLabel: String?,
    val travelLabel: String?,
    val upNextFooter: String?,
    val progressStartLabel: String?,
    val progressEndLabel: String?,
    /** Remaining session ms for the active timer row (on-site or wall-clock). */
    val timerRemainingMs: Long?,
    val blockedAppsLabel: String?,
    val intelCells: List<IntelCell>,
    val upcomingToday: List<UpcomingRow>,
    val nextTransitionAtMs: Long?,
  )

  fun parseBundle(raw: Map<String, Any?>): ScheduleBundle? {
    return try {
      parseBundle(JSONObject(raw))
    } catch (_: Exception) {
      null
    }
  }

  fun parseBundle(json: JSONObject): ScheduleBundle {
    val nodes = mutableListOf<FocusNode>()
    val nodesArray = json.optJSONArray("nodes") ?: JSONArray()
    for (index in 0 until nodesArray.length()) {
      val node = nodesArray.getJSONObject(index)
      nodes.add(
        FocusNode(
          id = node.optString("id"),
          title = node.optString("title"),
          kind = node.optString("kind", "custom"),
          scheduleType = node.optString("scheduleType", "class"),
          weekday = node.optInt("weekday"),
          startMinutes = node.optInt("startMinutes"),
          endMinutes = node.optInt("endMinutes"),
          locationLabel = node.optString("locationLabel").ifBlank { null },
          completedToday = node.optBoolean("completedToday"),
          skippedToday = node.optBoolean("skippedToday"),
        ),
      )
    }

    val activeJson = json.optJSONObject("activeSession")
    val activeSession = activeJson?.let {
      ActiveSession(
        nodeId = it.optString("nodeId"),
        nodeTitle = it.optString("nodeTitle"),
        zoneLabel = it.optString("zoneLabel"),
        scheduleType = it.optString("scheduleType", "class"),
        shieldStartsAtMs = it.optLong("shieldStartsAtMs"),
        endsAtMs = it.optLong("endsAtMs"),
        presenceVerified = it.optBoolean("presenceVerified"),
        requiredOnSiteMs = it.optLong("requiredOnSiteMs", -1L).takeIf { value -> value > 0L },
        onSiteAccumulatedMs = it.optLong("onSiteAccumulatedMs"),
        awaySinceMs = it.optLong("awaySinceMs", -1L).takeIf { value -> value > 0L },
        penaltyShieldEndsAtMs = it.optLong("penaltyShieldEndsAtMs", -1L).takeIf { value -> value > 0L },
        penaltyMinutes = it.optInt("penaltyMinutes", -1).takeIf { value -> value > 0 },
      )
    }

    val displayJson = json.optJSONObject("display") ?: JSONObject()
    val display = WidgetSessionStore.snapshotFromJson(displayJson)

    val intelCells = mutableListOf<IntelCell>()
    val intelArray = json.optJSONArray("intelCells") ?: JSONArray()
    for (index in 0 until intelArray.length()) {
      val cell = intelArray.getJSONObject(index)
      intelCells.add(
        IntelCell(
          label = cell.optString("label"),
          value = cell.optString("value"),
        ),
      )
    }

    val upcomingToday = mutableListOf<UpcomingRow>()
    val upcomingArray = json.optJSONArray("upcomingToday") ?: JSONArray()
    for (index in 0 until upcomingArray.length()) {
      val row = upcomingArray.getJSONObject(index)
      upcomingToday.add(
        UpcomingRow(
          timeLabel = row.optString("timeLabel"),
          title = row.optString("title"),
          locationLabel = row.optString("locationLabel"),
        ),
      )
    }

    val blockedPackages = mutableListOf<String>()
    val blockedArray = json.optJSONArray("blockedPackageNames") ?: JSONArray()
    for (index in 0 until blockedArray.length()) {
      val packageName = blockedArray.optString(index).trim()
      if (packageName.isNotEmpty()) {
        blockedPackages.add(packageName)
      }
    }

    return ScheduleBundle(
      syncedAtMs = json.optLong("syncedAtMs"),
      timezoneId = json.optString("timezoneId", TimeZone.getDefault().id),
      classPreBufferMinutes = json.optInt("classPreBufferMinutes", 30),
      sessionGapMergeMinutes = json.optInt("sessionGapMergeMinutes", 30),
      dailyGoalCompleted = json.optInt("dailyGoalCompleted"),
      dailyGoalTarget = json.optInt("dailyGoalTarget"),
      blockedAppsCount = json.optInt("blockedAppsCount"),
      blockedPackageNames = blockedPackages,
      totalFocusMinutes = json.optInt("totalFocusMinutes"),
      todayIso = json.optString("todayIso", ""),
      todayWeekday = json.optInt("todayWeekday"),
      nodes = nodes,
      activeSession = activeSession,
      display = display,
      intelCells = intelCells,
      upcomingToday = upcomingToday,
      appearance = WidgetTileAppearance.parse(json.optJSONObject("appearance")),
    )
  }

  fun compute(bundle: ScheduleBundle, nowMs: Long = System.currentTimeMillis()): ViewModel {
    val effectiveBundle = resolveEffectiveBundle(bundle, nowMs)
    val transitions = mutableListOf<Long>()
    val blockedAppsLabel =
      if (effectiveBundle.blockedAppsCount > 0) {
        if (effectiveBundle.blockedAppsCount == 1) "1 app blocked" else "${effectiveBundle.blockedAppsCount} apps blocked"
      } else {
        effectiveBundle.display.blockedAppsLabel
      }

    effectiveBundle.activeSession?.let { session ->
      transitions.add(session.endsAtMs)
      transitions.add(session.shieldStartsAtMs)
      session.penaltyShieldEndsAtMs?.let { transitions.add(it) }

      session.penaltyShieldEndsAtMs?.let { penaltyEnd ->
        if (nowMs < penaltyEnd) {
          val remaining = max(0L, penaltyEnd - nowMs)
          val minutes = session.penaltyMinutes ?: 30
          return baseViewModel(
            bundle = effectiveBundle,
            state = "on_the_way",
            metaLeft = kindLabelForNode(effectiveBundle, session.nodeId),
            metaRight = "LOCKED",
            sessionTitle = "Apps locked",
            headline = formatDurationClock(remaining),
            countdownLabel = formatDurationClock(remaining),
            subline = "+${minutes}m penalty · return to ${session.zoneLabel}",
            progressRatio = null,
            sessionStartsAtMs = null,
            sessionEndsAtMs = penaltyEnd,
            locationLabel = session.zoneLabel,
            focusNode = effectiveBundle.nodes.firstOrNull { it.id == session.nodeId },
            blockedAppsLabel = blockedAppsLabel,
            transitions = transitions,
            nowMs = nowMs,
          )
        }
      }

      if (session.awaySinceMs != null) {
        return baseViewModel(
          bundle = effectiveBundle,
          state = "on_the_way",
          metaLeft = kindLabelForNode(effectiveBundle, session.nodeId),
          metaRight = "AWAY",
          sessionTitle = session.nodeTitle,
          headline = effectiveBundle.display.headline.ifBlank { session.nodeTitle },
          countdownLabel = effectiveBundle.display.countdownLabel,
          subline = effectiveBundle.display.subline ?: "Return to ${session.zoneLabel}",
          progressRatio = effectiveBundle.display.progressRatio,
          sessionStartsAtMs = session.shieldStartsAtMs,
          sessionEndsAtMs = session.endsAtMs,
          locationLabel = session.zoneLabel,
          focusNode = effectiveBundle.nodes.firstOrNull { it.id == session.nodeId },
          blockedAppsLabel = blockedAppsLabel,
          transitions = transitions,
          nowMs = nowMs,
        )
      }

      if (!session.presenceVerified) {
        return baseViewModel(
          bundle = effectiveBundle,
          state = effectiveBundle.display.state.ifBlank { "on_the_way" },
          metaLeft = effectiveBundle.display.metaLeft.ifBlank { kindLabelForNode(effectiveBundle, session.nodeId) },
          metaRight = effectiveBundle.display.metaRight.ifBlank { "VERIFYING" },
          sessionTitle = effectiveBundle.display.sessionTitle.ifBlank { session.nodeTitle },
          headline = effectiveBundle.display.headline.ifBlank { session.nodeTitle },
          countdownLabel = effectiveBundle.display.countdownLabel,
          subline = effectiveBundle.display.subline ?: session.zoneLabel,
          progressRatio = effectiveBundle.display.progressRatio,
          sessionStartsAtMs = session.shieldStartsAtMs,
          sessionEndsAtMs = effectiveBundle.display.sessionEndsAtMs ?: session.endsAtMs,
          locationLabel = effectiveBundle.display.locationLabel ?: session.zoneLabel,
          focusNode = effectiveBundle.nodes.firstOrNull { it.id == session.nodeId },
          blockedAppsLabel = blockedAppsLabel,
          transitions = transitions,
          nowMs = nowMs,
        )
      }

      val activeMetrics = activeSessionMetrics(session, nowMs)
      transitions.add(nowMs + 60_000L)
      return baseViewModel(
        bundle = effectiveBundle,
        state = "active",
        metaLeft = kindLabelForNode(effectiveBundle, session.nodeId),
        metaRight = "LIVE",
        sessionTitle = session.nodeTitle,
        headline = activeMetrics.countdownLabel,
        countdownLabel = activeMetrics.countdownLabel,
        subline = activeMetrics.subline,
        progressRatio = activeMetrics.progressRatio,
        sessionStartsAtMs = session.shieldStartsAtMs,
        sessionEndsAtMs = session.endsAtMs,
        locationLabel = session.zoneLabel,
        focusNode = effectiveBundle.nodes.firstOrNull { it.id == session.nodeId },
        blockedAppsLabel = blockedAppsLabel,
        timerRemainingMs = activeMetrics.remainingMs,
        transitions = transitions,
        nowMs = nowMs,
      )
    }

    val nextNode = selectNextNode(effectiveBundle, nowMs)
    nextNode?.let { node ->
      val startMs = minutesToTodayMs(node.startMinutes, effectiveBundle.timezoneId, nowMs)
      val endMs = minutesToTodayMs(node.endMinutes, effectiveBundle.timezoneId, nowMs)
      transitions.add(startMs)
      transitions.add(endMs)

      val minutesUntil = max(0, ceilMinutes(startMs - nowMs))
      val inWindow = nowMs >= startMs && nowMs < endMs

      if (inWindow) {
        return baseViewModel(
          bundle = effectiveBundle,
          state = "on_the_way",
          metaLeft = kindLabel(node.kind),
          metaRight = "CHECK IN",
          sessionTitle = node.title,
          headline = "Window open",
          countdownLabel = null,
          subline = node.locationLabel,
          progressRatio = null,
          sessionStartsAtMs = startMs,
          sessionEndsAtMs = endMs,
          locationLabel = node.locationLabel,
          focusNode = node,
          blockedAppsLabel = blockedAppsLabel,
          transitions = transitions,
          nowMs = nowMs,
        )
      }

      return baseViewModel(
        bundle = effectiveBundle,
        state = "up_next",
        metaLeft = kindLabel(node.kind),
        metaRight = "UP NEXT",
        sessionTitle = node.title,
        headline = formatStartsInLabel(minutesUntil),
        countdownLabel = null,
        subline = node.locationLabel,
        progressRatio = null,
        sessionStartsAtMs = startMs,
        sessionEndsAtMs = endMs,
        locationLabel = node.locationLabel,
        focusNode = node,
        blockedAppsLabel = blockedAppsLabel,
        transitions = transitions,
        nowMs = nowMs,
      )
    }

    val allDone =
      effectiveBundle.nodes.any { it.weekday == effectiveBundle.todayWeekday } &&
        effectiveBundle.nodes.filter { it.weekday == effectiveBundle.todayWeekday }
          .all { it.completedToday || it.skippedToday }

    return baseViewModel(
      bundle = effectiveBundle,
      state = if (allDone) "on_the_way" else effectiveBundle.display.state.ifBlank { "on_the_way" },
      metaLeft = effectiveBundle.display.metaLeft.ifBlank { "FOCUS" },
      metaRight = effectiveBundle.display.metaRight.ifBlank { if (allDone) "DONE" else "TODAY" },
      sessionTitle = effectiveBundle.display.sessionTitle.ifBlank { if (allDone) "Day complete" else "Lowalk" },
      headline = effectiveBundle.display.headline.ifBlank { if (allDone) "Day complete." else "Open Lowalk" },
      countdownLabel = effectiveBundle.display.countdownLabel,
      subline = effectiveBundle.display.subline ?: if (allDone) "Every Focus Node completed." else null,
      progressRatio = if (effectiveBundle.dailyGoalTarget > 0) {
        effectiveBundle.dailyGoalCompleted.toFloat() / effectiveBundle.dailyGoalTarget.toFloat()
      } else {
        effectiveBundle.display.progressRatio
      },
      sessionStartsAtMs = null,
      sessionEndsAtMs = null,
      locationLabel = effectiveBundle.display.locationLabel,
      focusNode = null,
      blockedAppsLabel = blockedAppsLabel,
      transitions = transitions,
      nowMs = nowMs,
    )
  }

  /** True when the visible copy should advance on a ~1-minute wall-clock tick. */
  fun needsClockTick(viewModel: ViewModel, @Suppress("UNUSED_PARAMETER") nowMs: Long): Boolean {
    return when (viewModel.state) {
      "active", "up_next" -> true
      "on_the_way" ->
        viewModel.countdownLabel != null ||
          viewModel.metaRight == "LOCKED" ||
          viewModel.headline == "Window open" ||
          viewModel.headline == "Starting now" ||
          viewModel.headline.startsWith("Starts in")
      else -> false
    }
  }

  private fun resolveEffectiveBundle(bundle: ScheduleBundle, nowMs: Long): ScheduleBundle {
    val tz = TimeZone.getTimeZone(bundle.timezoneId)
    val calendar = Calendar.getInstance(tz).apply { timeInMillis = nowMs }
    val todayWeekday = calendar.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY
    val todayIso =
      String.format(
        Locale.US,
        "%04d-%02d-%02d",
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH) + 1,
        calendar.get(Calendar.DAY_OF_MONTH),
      )

    if (bundle.todayIso == todayIso && bundle.todayWeekday == todayWeekday) {
      return bundle
    }

    // Yesterday's completion flags must not carry over when the device calendar rolls.
    val nodes =
      bundle.nodes.map { node ->
        node.copy(completedToday = false, skippedToday = false)
      }

    return bundle.copy(
      todayIso = todayIso,
      todayWeekday = todayWeekday,
      nodes = nodes,
    )
  }

  private fun midnightMs(timezoneId: String, nowMs: Long): Long {
    val tz = TimeZone.getTimeZone(timezoneId)
    val calendar =
      Calendar.getInstance(tz).apply {
        timeInMillis = nowMs
        add(Calendar.DAY_OF_MONTH, 1)
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
    return calendar.timeInMillis
  }

  fun collectTransitionTimes(bundle: ScheduleBundle, nowMs: Long): List<Long> {
    val effectiveBundle = resolveEffectiveBundle(bundle, nowMs)
    val transitions = mutableListOf<Long>()
    transitions.add(midnightMs(effectiveBundle.timezoneId, nowMs))

    effectiveBundle.activeSession?.let { session ->
      transitions.add(session.endsAtMs)
      transitions.add(session.shieldStartsAtMs)
      session.penaltyShieldEndsAtMs?.let { transitions.add(it) }
      transitions.add(nowMs + 60_000L)
    }

    for (node in effectiveBundle.nodes) {
      if (!node.isOpenToday(effectiveBundle.todayWeekday)) continue
      val startMs = minutesToTodayMs(node.startMinutes, effectiveBundle.timezoneId, nowMs)
      val endMs = minutesToTodayMs(node.endMinutes, effectiveBundle.timezoneId, nowMs)
      if (startMs > nowMs) {
        transitions.add(startMs)
        transitions.add(nowMs + 60_000L)
      }
      if (endMs > nowMs) transitions.add(endMs)
      if (nowMs >= startMs && nowMs < endMs && effectiveBundle.activeSession == null) {
        transitions.add(nowMs + 60_000L)
      }
    }

    return transitions.filter { it > nowMs }.sorted()
  }

  private fun baseViewModel(
    bundle: ScheduleBundle,
    state: String,
    metaLeft: String,
    metaRight: String,
    sessionTitle: String,
    headline: String,
    countdownLabel: String?,
    subline: String?,
    progressRatio: Float?,
    sessionStartsAtMs: Long?,
    sessionEndsAtMs: Long?,
    locationLabel: String?,
    focusNode: FocusNode?,
    blockedAppsLabel: String?,
    timerRemainingMs: Long? = null,
    transitions: MutableList<Long>,
    nowMs: Long,
  ): ViewModel {
    val nextTransition = collectTransitionTimes(bundle, nowMs)
      .plus(transitions)
      .filter { it > nowMs }
      .minOrNull()

    val resolvedLocation = locationLabel ?: focusNode?.locationLabel ?: bundle.display.locationLabel
    val resolvedTimeWindow =
      bundle.display.timeWindowLabel
        ?: focusNode?.let { formatNodeTimeWindow(it) }
        ?: resolveSessionTimeWindow(sessionStartsAtMs, sessionEndsAtMs, bundle.timezoneId)
    val resolvedTravel = bundle.display.travelLabel
    val resolvedFooter =
      bundle.display.upNextFooter
        ?: buildUpNextFooter(bundle, sessionTitle)
    val progressLabels = resolveProgressLabels(
      state = state,
      sessionStartsAtMs = sessionStartsAtMs,
      sessionEndsAtMs = sessionEndsAtMs,
      focusNode = focusNode,
      timezoneId = bundle.timezoneId,
    )

    return ViewModel(
      state = state,
      sessionTitle = sessionTitle,
      metaLeft = metaLeft,
      metaRight = metaRight,
      headline = headline,
      subline = subline,
      countdownLabel = countdownLabel,
      progressRatio = progressRatio,
      dailyGoalCompleted = bundle.dailyGoalCompleted,
      dailyGoalTarget = bundle.dailyGoalTarget,
      sessionStartsAtMs = sessionStartsAtMs,
      sessionEndsAtMs = sessionEndsAtMs,
      timeWindowLabel = resolvedTimeWindow,
      locationLabel = resolvedLocation,
      travelLabel = resolvedTravel,
      upNextFooter = resolvedFooter,
      progressStartLabel = progressLabels?.first,
      progressEndLabel = progressLabels?.second,
      timerRemainingMs = timerRemainingMs,
      blockedAppsLabel = blockedAppsLabel,
      intelCells = bundle.intelCells,
      upcomingToday = bundle.upcomingToday,
      nextTransitionAtMs = nextTransition,
    )
  }

  private fun resolveProgressLabels(
    state: String,
    sessionStartsAtMs: Long?,
    sessionEndsAtMs: Long?,
    focusNode: FocusNode?,
    timezoneId: String,
  ): Pair<String, String>? {
    if (sessionStartsAtMs != null && sessionEndsAtMs != null && state == "active") {
      return Pair(
        formatMsLabel(sessionStartsAtMs, timezoneId),
        formatMsLabel(sessionEndsAtMs, timezoneId),
      )
    }
    focusNode?.let {
      return Pair(
        formatMinutesLabel(it.startMinutes),
        formatMinutesLabel(it.endMinutes),
      )
    }
    return null
  }

  private fun resolveSessionTimeWindow(
    sessionStartsAtMs: Long?,
    sessionEndsAtMs: Long?,
    timezoneId: String,
  ): String? {
    if (sessionStartsAtMs == null || sessionEndsAtMs == null) return null
    return "${formatMsLabel(sessionStartsAtMs, timezoneId)} – ${formatMsLabel(sessionEndsAtMs, timezoneId)}"
  }

  private fun formatNodeTimeWindow(node: FocusNode): String =
    "${formatMinutesLabel(node.startMinutes)} – ${formatMinutesLabel(node.endMinutes)}"

  private fun buildUpNextFooter(bundle: ScheduleBundle, currentTitle: String?): String? {
    val row =
      bundle.upcomingToday.firstOrNull { upcoming ->
        currentTitle == null || !upcoming.title.equals(currentTitle, ignoreCase = true)
      } ?: return null
    val locationSuffix =
      if (row.locationLabel.isNotBlank()) " · ${row.locationLabel}" else ""
    return "Up next: ${row.title} at ${row.timeLabel}$locationSuffix"
  }

  private fun formatMinutesLabel(minutes: Int): String {
    val hours24 = (minutes / 60) % 24
    val minutePart = minutes % 60
    val period = if (hours24 >= 12) "PM" else "AM"
    val hours12 = if (hours24 % 12 == 0) 12 else hours24 % 12
    return String.format(Locale.US, "%d:%02d %s", hours12, minutePart, period)
  }

  private fun formatMsLabel(ms: Long, timezoneId: String): String {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone(timezoneId)).apply {
      timeInMillis = ms
    }
    val minutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
    return formatMinutesLabel(minutes)
  }

  private data class ActiveMetrics(
    val countdownLabel: String,
    val subline: String,
    val progressRatio: Float?,
    val remainingMs: Long,
  )

  private fun activeSessionMetrics(
    session: ActiveSession,
    nowMs: Long,
  ): ActiveMetrics {
    if (session.scheduleType == "duration" && session.requiredOnSiteMs != null) {
      val remainingMs = max(0L, session.requiredOnSiteMs - session.onSiteAccumulatedMs)
      val remainingMinutes = max(1, ceilMinutes(remainingMs))
      val ratio =
        if (session.requiredOnSiteMs > 0L) {
          min(1f, session.onSiteAccumulatedMs.toFloat() / session.requiredOnSiteMs.toFloat())
        } else {
          null
        }
      return ActiveMetrics(
        countdownLabel = formatDurationClock(remainingMs),
        subline = if (remainingMinutes == 1L) "1 minute remaining on site." else "$remainingMinutes minutes remaining on site.",
        progressRatio = ratio,
        remainingMs = remainingMs,
      )
    }

    val remainingMs = max(0L, session.endsAtMs - nowMs)
    val remainingMinutes = max(0, ceilMinutes(remainingMs))
    val totalMs = max(1L, session.endsAtMs - session.shieldStartsAtMs)
    val elapsedMs = totalMs - remainingMs
    return ActiveMetrics(
      countdownLabel = formatDurationClock(remainingMs),
      subline = when {
        remainingMinutes <= 0L -> "Almost done — stay inside to finish."
        remainingMinutes == 1L -> "1 minute remaining."
        else -> "$remainingMinutes minutes remaining."
      },
      progressRatio = min(1f, elapsedMs.toFloat() / totalMs.toFloat()),
      remainingMs = remainingMs,
    )
  }

  private fun selectNextNode(bundle: ScheduleBundle, nowMs: Long): FocusNode? {
    return bundle.nodes
      .filter { it.isOpenToday(bundle.todayWeekday) }
      .filter { node ->
        val endMs = minutesToTodayMs(node.endMinutes, bundle.timezoneId, nowMs)
        nowMs < endMs
      }
      .sortedBy { it.startMinutes }
      .firstOrNull()
  }

  private fun kindLabelForNode(bundle: ScheduleBundle, nodeId: String): String {
    val node = bundle.nodes.firstOrNull { it.id == nodeId }
    return node?.let { kindLabel(it.kind) } ?: "FOCUS"
  }

  private fun kindLabel(kind: String): String =
    when (kind.lowercase(Locale.US)) {
      "class" -> "CLASS"
      "gym" -> "GYM"
      "library" -> "STUDY"
      else -> "FOCUS"
    }

  private fun minutesToTodayMs(minutes: Int, timezoneId: String, nowMs: Long): Long {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone(timezoneId)).apply {
      timeInMillis = nowMs
      set(Calendar.HOUR_OF_DAY, minutes / 60)
      set(Calendar.MINUTE, minutes % 60)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
    return calendar.timeInMillis
  }

  private fun ceilMinutes(durationMs: Long): Long =
    TimeUnit.MILLISECONDS.toMinutes(durationMs + 59_999L)

  private fun formatDurationClock(durationMs: Long): String {
    val totalSeconds = TimeUnit.MILLISECONDS.toSeconds(max(0L, durationMs))
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
      String.format(Locale.US, "%d:%02d:%02d", hours, minutes, seconds)
    } else {
      String.format(Locale.US, "%02d:%02d", minutes, seconds)
    }
  }

  private fun formatStartsInLabel(minutesUntil: Long): String =
    when {
      minutesUntil <= 0L -> "Starting now"
      minutesUntil == 1L -> "Starts in 1 minute"
      minutesUntil < 60L -> "Starts in $minutesUntil minutes"
      else -> {
        val hours = minutesUntil / 60
        val minutes = minutesUntil % 60
        if (minutes == 0L) "Starts in ${hours}h" else "Starts in ${hours}h ${minutes}m"
      }
    }
}
