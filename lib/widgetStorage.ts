/**
 * Persists the widget schedule bundle so headless widget tasks can render
 * without hydrating Zustand. Native shield sync stays on a separate path.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { WidgetScheduleBundle } from "@/types/widgetSchedule";

export const WIDGET_BUNDLE_STORAGE_KEY = "LowalkWidget:scheduleBundle";

export async function saveWidgetScheduleBundle(
  bundle: WidgetScheduleBundle,
): Promise<void> {
  await AsyncStorage.setItem(WIDGET_BUNDLE_STORAGE_KEY, JSON.stringify(bundle));
}

export async function loadWidgetScheduleBundle(): Promise<WidgetScheduleBundle | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_BUNDLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WidgetScheduleBundle;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}
