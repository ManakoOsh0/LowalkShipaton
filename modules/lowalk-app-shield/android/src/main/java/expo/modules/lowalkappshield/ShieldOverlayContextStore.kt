package expo.modules.lowalkappshield

import android.content.Context

/** Persists dynamic shield copy from JS so native ShieldActivity can render schedule-aware text. */
object ShieldOverlayContextStore {
  private const val PREF_NAME = "lowalk_app_shield"
  private const val PREF_NODE_KIND = "overlay_node_kind"
  private const val PREF_HEADLINE = "overlay_headline"
  private const val PREF_SUBTITLE = "overlay_subtitle"
  private const val PREF_DETAIL = "overlay_detail"
  private const val PREF_CTA_LABEL = "overlay_cta_label"

  private fun prefs(context: Context) =
    context.applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

  fun save(
    context: Context,
    nodeKind: String?,
    headline: String?,
    subtitle: String?,
    detail: String?,
    ctaLabel: String?,
  ) {
    prefs(context).edit()
      .putString(PREF_NODE_KIND, nodeKind?.trim().orEmpty())
      .putString(PREF_HEADLINE, headline?.trim().orEmpty())
      .putString(PREF_SUBTITLE, subtitle?.trim().orEmpty())
      .putString(PREF_DETAIL, detail?.trim().orEmpty())
      .putString(PREF_CTA_LABEL, ctaLabel?.trim().orEmpty())
      .apply()
  }

  fun read(context: Context): ShieldOverlayUi.Copy {
    val stored = prefs(context)
    val nodeKind = stored.getString(PREF_NODE_KIND, "").orEmpty().ifBlank { "custom" }
    val headline = stored.getString(PREF_HEADLINE, "").orEmpty().ifBlank {
      "Apps locked."
    }
    val subtitle = stored.getString(PREF_SUBTITLE, "").orEmpty().ifBlank {
      "To stop blocking, check in at your focus zone and complete your focus session"
    }
    val detail = stored.getString(PREF_DETAIL, "").orEmpty().ifBlank { null }
    val ctaLabel = stored.getString(PREF_CTA_LABEL, "").orEmpty().ifBlank { "Close" }
    return ShieldOverlayUi.Copy(
      nodeKind = nodeKind,
      headline = headline,
      subtitle = subtitle,
      detail = detail,
      ctaLabel = ctaLabel,
    )
  }

  fun clear(context: Context) {
    prefs(context).edit()
      .remove(PREF_NODE_KIND)
      .remove(PREF_HEADLINE)
      .remove(PREF_SUBTITLE)
      .remove(PREF_DETAIL)
      .remove(PREF_CTA_LABEL)
      .apply()
  }
}
