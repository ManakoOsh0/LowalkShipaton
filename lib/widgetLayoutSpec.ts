/**
 * Production Android widget layout tokens.
 * Keep in sync with:
 * - modules/lowalk-app-shield/android/src/main/res/layout/widget_focus_tile.xml
 * - modules/lowalk-app-shield/android/src/main/res/layout/widget_focus_hours.xml
 * - modules/lowalk-app-shield/android/src/main/res/xml/hero_widget_info.xml
 * - modules/lowalk-app-shield/android/src/main/res/xml/focus_hours_widget_info.xml
 * Widget picker previews use android:previewLayout on those XML files (API 31+).
 */
export const WIDGET_FOCUS_SPEC = {
  minWidthDp: 250,
  minHeightDp: 110,
  paddingDp: 14,
  /** In-app preview radius; native tiles use 48dp launcher outline (WidgetTileAppearance). */
  cornerRadiusDp: 16,
  title: {
    fontSize: 18,
    lineHeight: 22,
    maxLines: 2,
  },
  date: {
    fontSize: 14,
    lineHeight: 18,
    gap: 3,
    marginStart: 8,
  },
  activeTimer: {
    progressHeight: 5,
    marginTop: 6,
    labelsMarginTop: 4,
    fontSize: 13,
    lineHeight: 17,
  },
  status: {
    fontSize: 16,
    lineHeight: 20,
    minFontSize: 12,
    marginTop: 4,
    maxLines: 2,
    shrinkToFit: true,
  },
  detail: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 3,
    maxLines: 2,
  },
} as const;

export const WIDGET_HOURS_SPEC = {
  sizeDp: 110,
  paddingDp: 10,
  cornerRadiusDp: 16,
  value: {
    fontSize: 32,
    lineHeight: 36,
    minFontSize: 10,
    maxLines: 1,
    shrinkToFit: true,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    minFontSize: 10,
    marginTop: 4,
    maxLines: 1,
    shrinkToFit: true,
  },
  icon: {
    sizeDp: 44,
    marginBottom: 6,
  },
} as const;
