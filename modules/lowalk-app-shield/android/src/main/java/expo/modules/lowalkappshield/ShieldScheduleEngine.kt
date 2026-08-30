package expo.modules.lowalkappshield

import java.util.Calendar
import java.util.TimeZone
import kotlin.math.max

/**
 * Offline calendar shield logic — mirrors JS lib/shieldSchedule.ts so native alarms
 * can start/stop AppShieldMonitorService without opening the React app.
 */
object ShieldScheduleEngine {
  private const val SCHEDULE_AHEAD_DAYS = 8

  data class NodeShieldInterval(
    val nodeId: String,
    val scheduleType: String,
    val startsAtMs: Long,
    val nominalEndsAtMs: Long,
  )

  fun isShieldActive(bundle: HeroWidgetStateEngine.ScheduleBundle, nowMs: Long = System.currentTimeMillis()): Boolean {
    val session = bundle.activeSession
    session?.penaltyShieldEndsAtMs?.let { penaltyEnd ->
      if (nowMs < penaltyEnd) return true
    }

    if (session != null && isLiveActiveSessionShielded(session, nowMs, bundle.timezoneId)) {
      return true
    }

    return isPerNodeCalendarShieldActive(bundle, nowMs)
  }

  fun computeShieldEndsAtMs(
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long = System.currentTimeMillis(),
  ): Long {
    val timezone = TimeZone.getTimeZone(bundle.timezoneId)
    var maxEnd = nowMs + 60_000L

    bundle.activeSession?.penaltyShieldEndsAtMs?.let { penaltyEnd ->
      maxEnd = max(maxEnd, penaltyEnd)
    }

    val session = bundle.activeSession
    if (session != null && nowMs >= session.shieldStartsAtMs) {
      if (
        session.scheduleType == "duration" &&
        session.requiredOnSiteMs != null &&
        session.onSiteAccumulatedMs < session.requiredOnSiteMs
      ) {
        val remaining = session.requiredOnSiteMs - session.onSiteAccumulatedMs
        maxEnd = max(maxEnd, nowMs + remaining)
        maxEnd = minOf(maxEnd, endOfDayMs(nowMs, timezone))
      }
      if (session.scheduleType == "class") {
        maxEnd = max(maxEnd, session.endsAtMs)
      }
    }

    val intervals = todayShieldIntervals(bundle, nowMs, timezone)
    for (interval in intervals) {
      if (!isIntervalShieldActive(interval, bundle, nowMs, timezone)) continue
      val intervalEnd = intervalShieldEndMs(interval, bundle.activeSession, nowMs, timezone)
      if (nowMs < intervalEnd) {
        maxEnd = max(maxEnd, intervalEnd)
      }
    }

    if (isGapMergeShieldActive(intervals, bundle, nowMs, timezone)) {
      for (index in 0 until intervals.size - 1) {
        val next = intervals[index + 1]
        if (nowMs < next.startsAtMs) {
          maxEnd = max(maxEnd, next.startsAtMs)
        }
      }
    }

    return maxEnd
  }

  fun collectShieldTransitionTimes(
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long = System.currentTimeMillis(),
  ): List<Long> {
    val timezone = TimeZone.getTimeZone(bundle.timezoneId)
    val transitions = mutableListOf<Long>()

    bundle.activeSession?.let { session ->
      if (session.shieldStartsAtMs > nowMs) transitions.add(session.shieldStartsAtMs)
      if (session.endsAtMs > nowMs) transitions.add(session.endsAtMs)
      session.penaltyShieldEndsAtMs?.let { if (it > nowMs) transitions.add(it) }
    }

    for (dayOffset in 0 until SCHEDULE_AHEAD_DAYS) {
      val dayAnchorMs = dayAnchorMs(nowMs, dayOffset, timezone)
      val weekday = jsWeekday(dayAnchorMs, timezone)

      for (node in bundle.nodes) {
        if (node.weekday != weekday) continue
        if (dayOffset == 0 && isCompletionCurrent(bundle, nowMs, timezone) && (node.completedToday || node.skippedToday)) continue

        val interval = nodeShieldInterval(node, bundle.classPreBufferMinutes, dayAnchorMs, timezone)
          ?: continue

        if (interval.startsAtMs > nowMs) transitions.add(interval.startsAtMs)
        if (interval.nominalEndsAtMs > nowMs) transitions.add(interval.nominalEndsAtMs)
      }
    }

    if (isShieldActive(bundle, nowMs)) {
      transitions.add(nowMs + 60_000L)
    }

    return transitions.filter { it > nowMs }.sorted().distinct()
  }

  fun selectPrimaryObligationNode(
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long = System.currentTimeMillis(),
  ): HeroWidgetStateEngine.FocusNode? {
    val timezone = TimeZone.getTimeZone(bundle.timezoneId)
    val session = bundle.activeSession

    if (session != null) {
      val current = bundle.nodes.firstOrNull { it.id == session.nodeId }
      if (current != null && isNodeOpenToday(current, bundle, nowMs, timezone)) {
        if (session.scheduleType == "duration" && session.requiredOnSiteMs != null) {
          if (session.onSiteAccumulatedMs < session.requiredOnSiteMs) return current
        } else if (session.scheduleType == "class") {
          val endMs = max(
            session.endsAtMs,
            session.penaltyShieldEndsAtMs ?: 0L,
          )
          if (nowMs < endMs) return current
        } else {
          return current
        }
      }
    }

    val endOfDay = endOfDayMs(nowMs, timezone)
    val intervals = todayShieldIntervals(bundle, nowMs, timezone)
    for (interval in intervals) {
      if (nowMs < interval.startsAtMs) continue
      if (interval.scheduleType == "duration") {
        if (nowMs >= endOfDay) continue
      } else if (nowMs >= interval.nominalEndsAtMs) {
        continue
      }
      return bundle.nodes.firstOrNull { it.id == interval.nodeId }
    }

    return null
  }

  private fun isLiveActiveSessionShielded(
    session: HeroWidgetStateEngine.ActiveSession,
    nowMs: Long,
    timezoneId: String,
  ): Boolean {
    if (session.scheduleType == "duration" && session.requiredOnSiteMs != null) {
      if (isDurationExpired(session.shieldStartsAtMs, nowMs, timezoneId)) return false
      return session.onSiteAccumulatedMs < session.requiredOnSiteMs
    }
    if (session.scheduleType == "class") {
      val endMs = max(session.endsAtMs, session.penaltyShieldEndsAtMs ?: 0L)
      return nowMs < endMs
    }
    return session.endsAtMs > nowMs
  }

  private fun isPerNodeCalendarShieldActive(
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long,
  ): Boolean {
    val timezone = TimeZone.getTimeZone(bundle.timezoneId)
    val intervals = todayShieldIntervals(bundle, nowMs, timezone)
    if (intervals.any { isIntervalShieldActive(it, bundle, nowMs, timezone) }) {
      return true
    }
    return isGapMergeShieldActive(intervals, bundle, nowMs, timezone)
  }

  private fun isGapMergeShieldActive(
    intervals: List<NodeShieldInterval>,
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long,
    timezone: TimeZone,
  ): Boolean {
    val gapMs = bundle.sessionGapMergeMinutes * 60_000L
    for (index in 0 until intervals.size - 1) {
      val previous = intervals[index]
      val next = intervals[index + 1]
      val gapBetween = next.startsAtMs - previous.nominalEndsAtMs
      if (gapBetween < 0 || gapBetween >= gapMs) continue
      if (nowMs < previous.nominalEndsAtMs || nowMs >= next.startsAtMs) continue
      if (isIntervalShieldActive(previous, bundle, nowMs, timezone)) continue
      return true
    }
    return false
  }

  private fun isIntervalShieldActive(
    interval: NodeShieldInterval,
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long,
    timezone: TimeZone,
  ): Boolean {
    if (nowMs < interval.startsAtMs) return false

    val node = bundle.nodes.firstOrNull { it.id == interval.nodeId } ?: return false
    if (!isNodeOpenToday(node, bundle, nowMs, timezone)) return false

    if (interval.scheduleType == "duration") {
      if (nowMs >= endOfDayMs(nowMs, timezone)) return false
      val session = bundle.activeSession
      if (session?.nodeId == interval.nodeId && session.requiredOnSiteMs != null) {
        if (isDurationExpired(session.shieldStartsAtMs, nowMs, bundle.timezoneId)) return false
        return session.onSiteAccumulatedMs < session.requiredOnSiteMs
      }
      return true
    }

    return nowMs < intervalShieldEndMs(interval, bundle.activeSession, nowMs, timezone)
  }

  private fun intervalShieldEndMs(
    interval: NodeShieldInterval,
    session: HeroWidgetStateEngine.ActiveSession?,
    nowMs: Long,
    timezone: TimeZone,
  ): Long {
    if (interval.scheduleType == "duration") {
      return endOfDayMs(nowMs, timezone)
    }
    var endMs = interval.nominalEndsAtMs
    if (session?.nodeId == interval.nodeId) {
      endMs = max(endMs, session.endsAtMs)
      session.penaltyShieldEndsAtMs?.let { endMs = max(endMs, it) }
    }
    return endMs
  }

  private fun todayShieldIntervals(
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long,
    timezone: TimeZone,
  ): List<NodeShieldInterval> {
    val weekday = jsWeekday(nowMs, timezone)
    return bundle.nodes
      .filter { node ->
        node.weekday == weekday &&
          !(isCompletionCurrent(bundle, nowMs, timezone) && (node.completedToday || node.skippedToday))
      }
      .mapNotNull { node ->
        nodeShieldInterval(node, bundle.classPreBufferMinutes, nowMs, timezone)
      }
      .sortedBy { it.startsAtMs }
  }

  private fun nodeShieldInterval(
    node: HeroWidgetStateEngine.FocusNode,
    classPreBufferMinutes: Int,
    dayAnchorMs: Long,
    timezone: TimeZone,
  ): NodeShieldInterval? {
    val bufferMinutes = classPreBufferMinutes
    val startsAtMs = minutesOnDayMs(node.startMinutes - bufferMinutes, dayAnchorMs, timezone)
    val nominalEndsAtMs = minutesOnDayMs(node.endMinutes, dayAnchorMs, timezone)
    return NodeShieldInterval(
      nodeId = node.id,
      scheduleType = node.scheduleType,
      startsAtMs = startsAtMs,
      nominalEndsAtMs = nominalEndsAtMs,
    )
  }

  private fun isNodeOpenToday(
    node: HeroWidgetStateEngine.FocusNode,
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long,
    timezone: TimeZone,
  ): Boolean {
    if (node.weekday != jsWeekday(nowMs, timezone)) return false
    if (isCompletionCurrent(bundle, nowMs, timezone) && (node.completedToday || node.skippedToday)) {
      return false
    }
    return true
  }

  private fun isCompletionCurrent(
    bundle: HeroWidgetStateEngine.ScheduleBundle,
    nowMs: Long,
    timezone: TimeZone,
  ): Boolean {
    val storedIso = bundle.todayIso.trim()
    if (storedIso.isEmpty()) return false
    return storedIso == localIsoDate(nowMs, timezone)
  }

  private fun localIsoDate(timeMs: Long, timezone: TimeZone): String {
    val calendar = Calendar.getInstance(timezone).apply { timeInMillis = timeMs }
    val year = calendar.get(Calendar.YEAR)
    val month = calendar.get(Calendar.MONTH) + 1
    val day = calendar.get(Calendar.DAY_OF_MONTH)
    return String.format("%04d-%02d-%02d", year, month, day)
  }

  private fun isDurationExpired(shieldStartsAtMs: Long, nowMs: Long, timezoneId: String): Boolean {
    val timezone = TimeZone.getTimeZone(timezoneId)
    val startDay = dayStartMs(shieldStartsAtMs, timezone)
    val todayStart = dayStartMs(nowMs, timezone)
    return todayStart > startDay
  }

  private fun jsWeekday(timeMs: Long, timezone: TimeZone): Int {
    val calendar = Calendar.getInstance(timezone).apply { timeInMillis = timeMs }
    return calendar.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY
  }

  private fun dayAnchorMs(nowMs: Long, dayOffset: Int, timezone: TimeZone): Long {
    val calendar = Calendar.getInstance(timezone).apply {
      timeInMillis = nowMs
      set(Calendar.HOUR_OF_DAY, 12)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
      add(Calendar.DAY_OF_YEAR, dayOffset)
    }
    return calendar.timeInMillis
  }

  private fun dayStartMs(timeMs: Long, timezone: TimeZone): Long {
    val calendar = Calendar.getInstance(timezone).apply {
      timeInMillis = timeMs
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
    return calendar.timeInMillis
  }

  private fun endOfDayMs(timeMs: Long, timezone: TimeZone): Long {
    val calendar = Calendar.getInstance(timezone).apply {
      timeInMillis = timeMs
      set(Calendar.HOUR_OF_DAY, 23)
      set(Calendar.MINUTE, 59)
      set(Calendar.SECOND, 59)
      set(Calendar.MILLISECOND, 999)
    }
    return calendar.timeInMillis
  }

  private fun minutesOnDayMs(minutes: Int, dayAnchorMs: Long, timezone: TimeZone): Long {
    val calendar = Calendar.getInstance(timezone).apply {
      timeInMillis = dayAnchorMs
      set(Calendar.HOUR_OF_DAY, minutes / 60)
      set(Calendar.MINUTE, minutes % 60)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
    return calendar.timeInMillis
  }
}
