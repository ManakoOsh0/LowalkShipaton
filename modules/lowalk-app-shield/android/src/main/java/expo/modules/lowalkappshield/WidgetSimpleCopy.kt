package expo.modules.lowalkappshield

import java.util.Locale
import java.util.concurrent.TimeUnit
import kotlin.math.max

/** Three-line focus widget copy — title, status, optional detail. */
object WidgetSimpleCopy {
  data class Copy(
    val title: String,
    val status: String?,
    val detail: String?,
  )

  fun resolve(viewModel: HeroWidgetStateEngine.ViewModel): Copy {
    val headline = resolveHeadline(viewModel)
    val title = viewModel.sessionTitle.trim().ifBlank { headline }

    if (viewModel.state == "active") {
      return Copy(title = title, status = null, detail = null)
    }
    val subline = viewModel.subline?.trim().orEmpty()
    val travel = viewModel.travelLabel?.trim().orEmpty()
    val timeLocation = buildTimeLocation(viewModel)
    val isTraveling =
      viewModel.state == "on_the_way" && !viewModel.travelLabel.isNullOrBlank()

    var status: String? = null
    when {
      isTraveling && headline.isNotBlank() && !isSameText(headline, title) -> status = headline
      shouldUseHeadlineAsStatus(viewModel, headline, title) -> status = headline
      subline.isNotEmpty() &&
        shouldUseSublineAsStatus(subline, title, viewModel.locationLabel, isTraveling) ->
        status = subline
      travel.isNotEmpty() && !isSameText(travel, title) && !isTraveling -> status = travel
    }

    val detail =
      if (isTraveling) {
        buildTravelingDetail(viewModel)
      } else {
        pickDetail(
          listOf(
            timeLocation,
            travel.takeIf { it.isNotEmpty() && status != travel },
            subline.takeIf { it.isNotEmpty() && status != subline },
          ),
          title,
          status,
        )
      }

    return Copy(title = title, status = status, detail = detail)
  }

  private fun pickDetail(
    candidates: List<String?>,
    title: String,
    status: String?,
  ): String? {
    val parts = mutableListOf<String>()
    for (candidate in candidates) {
      val value = candidate?.trim().orEmpty()
      if (value.isEmpty()) continue
      if (isSameText(value, title)) continue
      if (status != null && isSameText(value, status)) continue
      if (parts.any { isContainedIn(it, value) }) continue
      parts.add(value)
    }
    return parts.takeIf { it.isNotEmpty() }?.joinToString(" · ")
  }

  private fun buildTimeLocation(viewModel: HeroWidgetStateEngine.ViewModel): String? {
    val time = viewModel.timeWindowLabel?.trim().orEmpty()
    val location = viewModel.locationLabel?.trim().orEmpty()
    return when {
      time.isNotEmpty() && location.isNotEmpty() -> "$time\n$location"
      time.isNotEmpty() -> time
      location.isNotEmpty() -> location
      else -> null
    }
  }

  private fun shouldUseHeadlineAsStatus(
    viewModel: HeroWidgetStateEngine.ViewModel,
    headline: String,
    title: String,
  ): Boolean {
    if (isSameText(headline, title)) return false
    if (viewModel.state == "up_next" && !viewModel.timeWindowLabel.isNullOrBlank()) return false
    return true
  }

  private fun shouldUseSublineAsStatus(
    subline: String,
    title: String,
    locationLabel: String?,
    isTraveling: Boolean,
  ): Boolean {
    if (isTraveling) return false
    if (isSameText(subline, title)) return false
    val location = locationLabel?.trim().orEmpty()
    if (location.isNotEmpty() && isSameText(subline, location)) return false
    return true
  }

  private fun buildTravelingDetail(viewModel: HeroWidgetStateEngine.ViewModel): String? {
    val subline = viewModel.subline?.trim().orEmpty()
    val location = viewModel.locationLabel?.trim().orEmpty()

    if (subline.isNotEmpty()) {
      return if (location.isNotEmpty() && !isContainedIn(subline, location)) {
        "$subline\n$location"
      } else {
        subline
      }
    }

    if (location.isNotEmpty()) return location
    return viewModel.timeWindowLabel?.trim()?.takeIf { it.isNotEmpty() }
  }

  private fun resolveHeadline(viewModel: HeroWidgetStateEngine.ViewModel): String {
    if (viewModel.state == "active") {
      val countdown = viewModel.countdownLabel?.trim().orEmpty()
      if (countdown.isNotEmpty()) return countdown
      val endsAt = viewModel.sessionEndsAtMs
      if (endsAt != null) {
        val remainingMs = max(0L, endsAt - System.currentTimeMillis())
        return formatCountdown(remainingMs)
      }
    }
    return viewModel.headline.ifBlank { viewModel.sessionTitle }
  }

  private fun formatCountdown(remainingMs: Long): String {
    val totalSeconds = TimeUnit.MILLISECONDS.toSeconds(remainingMs)
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
      String.format(Locale.US, "%d:%02d:%02d", hours, minutes, seconds)
    } else {
      String.format(Locale.US, "%02d:%02d", minutes, seconds)
    }
  }

  private fun normalize(value: String): String =
    value.trim().lowercase(Locale.US).replace(Regex("""\s+"""), " ")

  private fun isSameText(a: String, b: String): Boolean = normalize(a) == normalize(b)

  private fun isContainedIn(haystack: String, needle: String): Boolean {
    val h = normalize(haystack)
    val n = normalize(needle)
    return h.contains(n) || n.contains(h)
  }
}
