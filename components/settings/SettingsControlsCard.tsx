/**
 * SettingsControlsCard — notifications toggle and system permission status.
 */
import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, Switch, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { FormSectionCard } from "@/components/form/FormSectionCard";
import { SettingsListRow } from "@/components/settings/SettingsListRow";
import { useThemeColors } from "@/hooks/useThemeColors";
import { openAppSettings } from "@/lib/openExternal";
import {
  areSessionRemindersSupported,
  ensureNotificationPermission,
  getNotificationPermissionStatus,
  syncSessionReminders,
  type NotificationPermissionStatus,
} from "@/services/sessionReminders";
import { cancelAllScheduledUserAlerts } from "@/services/userNotifications";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

function getNotificationsStatusLabel(
  enabled: boolean,
  permission: NotificationPermissionStatus,
): string {
  if (!enabled || permission !== "granted") return "Off";
  return "On";
}

export function SettingsControlsCard() {
  const colors = useThemeColors();
  const notificationsEnabled = useUserStore((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useUserStore((state) => state.setNotificationsEnabled);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionStatus>("undetermined");
  const remindersSupported = areSessionRemindersSupported();

  const refreshPermission = useCallback(async () => {
    setPermission(await getNotificationPermissionStatus());
  }, []);

  useEffect(() => {
    void refreshPermission();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshPermission();
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const statusLabel = remindersSupported
    ? getNotificationsStatusLabel(notificationsEnabled, permission)
    : "Unavailable";

  const onToggle = async (next: boolean) => {
    setNotificationsEnabled(next);

    if (!next) {
      await cancelAllScheduledUserAlerts();
      return;
    }

    const granted = await ensureNotificationPermission();
    await refreshPermission();
    if (!granted) return;

    await syncSessionReminders(focusNodes, anchors, classPreBufferMinutes, new Date(), {
      enabled: true,
    });
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <FormSectionCard title="Controls">
        <SettingsListRow
          icon="notifications-outline"
          label="Notifications"
          value={statusLabel}
          onPress={() => setSheetOpen(true)}
          accessibilityLabel={`Notifications, ${statusLabel}`}
        />
      </FormSectionCard>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 18,
              lineHeight: 24,
              color: colors.foreground,
            }}
          >
            Notifications
          </Text>

          {!remindersSupported ? (
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 14,
                lineHeight: 20,
                color: colors.muted,
              }}
            >
              Local reminders are not available in Expo Go on Android. Use a development or preview
              build to test notifications.
            </Text>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 16,
                      lineHeight: 22,
                      color: colors.foreground,
                    }}
                  >
                    Focus alerts
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.muted,
                    }}
                  >
                    Pre-buffer, missed sessions, leaving your venue, penalties, and daily goal.
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Focus alerts"
                  value={notificationsEnabled}
                  onValueChange={(value) => void onToggle(value)}
                />
              </View>

              {permission !== "granted" ? (
                <View
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    padding: 14,
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.muted,
                    }}
                  >
                    {permission === "denied"
                      ? "Notifications are turned off in system Settings."
                      : "Allow notifications so Lowalk can remind you before sessions start."}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void openAppSettings()}
                    style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins-SemiBold",
                        fontSize: 14,
                        color: colors.skyDeep,
                      }}
                    >
                      Open system Settings
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.muted,
                }}
              >
                Focus alerts cover pre-buffer, missed sessions, leaving your venue, and daily
                goal celebrations. Session status is a silent indicator while a session runs — you
                can lower it in system Settings without turning off alerts.
              </Text>
            </>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}
