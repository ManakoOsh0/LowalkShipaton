import { useEffect, useState } from "react";
import { Platform, Pressable, Switch, Text, View } from "react-native";
import { useCameraPermission } from "react-native-vision-camera";
import { useRouter } from "expo-router";

import { isWakeAlarmSupported } from "@/features/wake-challenge/services/alarmService";
import { useThemeColors } from "@/hooks/useThemeColors";
import { startTestWakeChallenge } from "@/hooks/useWakeChallengeLifecycle";
import { useWakeAlarmStore } from "@/store/useWakeAlarmStore";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}

/** Standalone wake alarm configuration — Android dev builds only for MVP. */
export function WakeAlarmCard() {
  const colors = useThemeColors();
  const router = useRouter();
  const supported = isWakeAlarmSupported();
  const { hasPermission, requestPermission } = useCameraPermission();

  const enabled = useWakeAlarmStore((state) => state.enabled);
  const hour = useWakeAlarmStore((state) => state.hour);
  const minute = useWakeAlarmStore((state) => state.minute);
  const repeatDays = useWakeAlarmStore((state) => state.repeatDays);
  const targetReps = useWakeAlarmStore((state) => state.targetReps);
  const setEnabled = useWakeAlarmStore((state) => state.setEnabled);
  const setTime = useWakeAlarmStore((state) => state.setTime);
  const toggleRepeatDay = useWakeAlarmStore((state) => state.toggleRepeatDay);
  const setTargetReps = useWakeAlarmStore((state) => state.setTargetReps);

  const [timePickerMinutes, setTimePickerMinutes] = useState(hour * 60 + minute);

  useEffect(() => {
    setTimePickerMinutes(hour * 60 + minute);
  }, [hour, minute]);

  const applyTime = (totalMinutes: number) => {
    const nextHour = Math.floor(totalMinutes / 60) % 24;
    const nextMinute = totalMinutes % 60;
    setTimePickerMinutes(nextHour * 60 + nextMinute);
    setTime(nextHour, nextMinute);
  };

  if (!supported) {
    return (
      <View style={{ marginTop: 24 }}>
        <Text
          style={{
            marginBottom: 10,
            fontFamily: "Poppins-SemiBold",
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: colors.muted,
          }}
        >
          Wake Alarm
        </Text>
        <View
          style={{
            borderRadius: 20,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text style={{ fontFamily: "Poppins-Regular", fontSize: 14, color: colors.muted }}>
            {Platform.OS === "ios"
              ? "Wake alarms are coming to iOS soon."
              : "Wake alarms require an Android development build — they do not run in Expo Go."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Wake Alarm
      </Text>

      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 15, color: colors.foreground }}>
              Push-up wake challenge
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              Complete push-ups on camera to stop the alarm.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.foreground}
          />
        </View>

        <View>
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.muted }}>
            Alarm time
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontFamily: "Poppins-SemiBold",
              fontSize: 24,
              color: colors.foreground,
            }}
          >
            {formatTime(hour, minute)}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => applyTime(timePickerMinutes - 15)}
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: "Poppins-Medium", color: colors.foreground }}>- 15 min</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => applyTime(timePickerMinutes + 15)}
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: "Poppins-Medium", color: colors.foreground }}>+ 15 min</Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.muted }}>
            Repeat
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            {WEEKDAY_LABELS.map((label, weekday) => {
              const selected = repeatDays.includes(weekday);
              return (
                <Pressable
                  key={`${label}-${weekday}`}
                  accessibilityRole="button"
                  onPress={() => toggleRepeatDay(weekday)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 12,
                      color: selected ? "#141210" : colors.foreground,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.muted }}>
            Push-ups required
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTargetReps(targetReps - 1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 18, color: colors.foreground }}>
                -
              </Text>
            </Pressable>
            <Text style={{ fontFamily: "Poppins-Bold", fontSize: 28, color: colors.foreground, minWidth: 40, textAlign: "center" }}>
              {targetReps}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTargetReps(targetReps + 1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 18, color: colors.foreground }}>
                +
              </Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.muted }}>
            Camera permission
          </Text>
          <Text style={{ marginTop: 6, fontFamily: "Poppins-Regular", fontSize: 13, color: colors.foreground }}>
            {hasPermission ? "Granted" : "Required for push-up detection"}
          </Text>
          {!hasPermission ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void requestPermission()}
              style={{ marginTop: 10, alignSelf: "flex-start" }}
            >
              <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 14, color: colors.skyDeep }}>
                Request camera access
              </Text>
            </Pressable>
          ) : null}
        </View>

        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => startTestWakeChallenge(router, targetReps)}
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 14, color: colors.skyDeep }}>
              Test wake challenge
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
