/**
 * Production Android widget layout tokens.
 * Keep in sync with:
 * - modules/lowalk-app-shield/android/src/main/res/layout/widget_focus_tile.xml
 * - modules/lowalk-app-shield/android/src/main/res/layout/widget_focus_hours.xml
 * - modules/lowalk-app-shield/android/src/main/res/xml/hero_widget_info.xml
 * - modules/lowalk-app-shield/android/src/main/res/xml/focus_hours_widget_info.xml
 */
export const WIDGET_FOCUS_SPEC = {
  minWidthDp: 250,
  minHeightDp: 110,
  paddingDp: 16,
  cornerRadiusDp: 16,
  title: {
    fontSize: 16,
    lineHeight: 20,
    maxLines: 2,
  },
  date: {
    fontSize: 13,
    lineHeight: 16,
    gap: 3,
    marginStart: 8,
  },
  activeTimer: {
    progressHeight: 4,
    marginTop: 8,
    labelsMarginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
  status: {
    fontSize: 14,
    lineHeight: 18,
    minFontSize: 10,
    marginTop: 4,
    maxLines: 2,
    shrinkToFit: true,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    maxLines: 2,
  },
} as const;

export const WIDGET_HOURS_SPEC = {
  sizeDp: 110,
  paddingDp: 12,
  cornerRadiusDp: 16,
  value: {
    fontSize: 28,
    lineHeight: 32,
    minFontSize: 8,
    maxLines: 1,
    shrinkToFit: true,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    minFontSize: 8,
    marginTop: 2,
    maxLines: 1,
    shrinkToFit: true,
  },
  icon: {
    sizeDp: 40,
    marginBottom: 4,
  },
} as const;
