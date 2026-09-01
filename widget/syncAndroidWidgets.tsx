/**
 * Persists the schedule bundle and asks native Kotlin to redraw home-screen widgets.
 */
import { Platform } from "react-native";

import { saveWidgetScheduleBundle } from "@/lib/widgetStorage";
import { syncWidgetSchedule, isAppShieldSupported } from "lowalk-app-shield";
import type { WidgetScheduleBundle } from "@/types/widgetSchedule";

export async function persistAndRefreshAndroidWidgets(
  bundle: WidgetScheduleBundle,
): Promise<void> {
  await saveWidgetScheduleBundle(bundle);
  if (Platform.OS !== "android" || !isAppShieldSupported()) return;
  await syncWidgetSchedule(bundle as unknown as Record<string, unknown>);
}
