/**
 * ScheduleWhenCard — inline weekday chips plus a time picker sheet for Focus Node create/edit.
 */
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { FormRow } from "@/components/form/FormRow";
import { FormSectionCard } from "@/components/form/FormSectionCard";
import {
  DURATION_PRESETS,
  SchedulePickerSheet,
  StartTimeWheels,
  TimeRangeWheels,
} from "@/components/ScheduleTimeFields";
import { formatTimeLabel } from "@/lib/time";
import type { ThemeColors } from "@/theme/tokens";
import type { Weekday } from "@/types/focusNode";

const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function sortWeekdays(weekdays: Weekday[]): Weekday[] {
  return [...weekdays].sort(
    (a, b) =>
      WEEKDAY_OPTIONS.findIndex((option) => option.value === a) -
      WEEKDAY_OPTIONS.findIndex((option) => option.value === b),
  );
}

function formatDurationLabel(hours: number): string {
  if (hours === 0.5) return "30 min";
  if (hours === 1) return "1 hr";
  if (hours === 1.5) return "1.5 hr";
  if (hours === 2) return "2 hr";
  if (hours === 3) return "3 hr";
  return `${hours} hr`;
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

type ScheduleWhenCardProps = {
  weekdays: Weekday[];
  onWeekdaysChange: (value: Weekday[]) => void;
  allowMultipleWeekdays?: boolean;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  durationHours: number;
  onDurationHoursChange: (value: number) => void;
  usesClassSchedule: boolean;
  colors: ThemeColors;
};

export function ScheduleWhenCard({
  weekdays,
  onWeekdaysChange,
  allowMultipleWeekdays = false,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  durationHours,
  onDurationHoursChange,
  usesClassSchedule,
  colors,
}: ScheduleWhenCardProps) {
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [draftStart, setDraftStart] = useState(startTime);
  const [draftEnd, setDraftEnd] = useState(endTime);
  const [draftDuration, setDraftDuration] = useState(durationHours);

  const timeLabel = usesClassSchedule
    ? isValidTime(startTime) && isValidTime(endTime)
      ? `${formatTimeLabel(startTime)} – ${formatTimeLabel(endTime)}`
      : "Set time"
    : isValidTime(startTime)
      ? `${formatTimeLabel(startTime)} · ${formatDurationLabel(durationHours)}`
      : "Set time";

  const openTimeSheet = () => {
    setDraftStart(startTime);
    setDraftEnd(endTime);
    setDraftDuration(durationHours);
    setTimeSheetVisible(true);
  };

  const handleTimeConfirm = () => {
    onStartTimeChange(draftStart);
    if (usesClassSchedule) {
      onEndTimeChange(draftEnd);
    } else {
      onDurationHoursChange(draftDuration);
    }
    setTimeSheetVisible(false);
  };

  const toggleWeekday = (day: Weekday) => {
    if (allowMultipleWeekdays) {
      onWeekdaysChange(
        sortWeekdays(
          weekdays.includes(day)
            ? weekdays.length === 1
              ? weekdays
              : weekdays.filter((value) => value !== day)
            : [...weekdays, day],
        ),
      );
      return;
    }

    onWeekdaysChange([day]);
  };

  return (
    <>
      <FormSectionCard title="When">
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              {allowMultipleWeekdays ? "Days" : "Day"}
            </Text>
            {allowMultipleWeekdays ? (
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors.muted,
                }}
              >
                Tap every day this session repeats.
              </Text>
            ) : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {WEEKDAY_OPTIONS.map((option) => {
                const selected = weekdays.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => toggleWeekday(option.value)}
                    style={{
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins-SemiBold",
                        fontSize: 13,
                        color: selected ? "#F0EDE9" : colors.foreground,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 12,
                lineHeight: 16,
                color: colors.muted,
              }}
            >
              Sessions for other days appear in This week, not on Home until that day.
            </Text>
          </View>

          <FormRow
            label="Time"
            value={timeLabel}
            onPress={openTimeSheet}
            accessibilityLabel="Schedule time"
            showDivider={false}
          />
        </View>
      </FormSectionCard>

      <SchedulePickerSheet
        visible={timeSheetVisible}
        title="Time"
        onClose={() => setTimeSheetVisible(false)}
        onConfirm={handleTimeConfirm}
        colors={colors}
      >
        <View style={{ gap: 16 }}>
          {usesClassSchedule ? (
            <TimeRangeWheels
              startTime={draftStart}
              endTime={draftEnd}
              onChangeStartTime={setDraftStart}
              onChangeEndTime={setDraftEnd}
              colors={colors}
            />
          ) : (
            <>
              <StartTimeWheels
                startTime={draftStart}
                onChangeStartTime={setDraftStart}
                colors={colors}
              />
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.muted,
                  }}
                >
                  Duration
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {DURATION_PRESETS.map((preset) => {
                    const selected = Math.abs(preset.hours - draftDuration) < 0.001;
                    return (
                      <Pressable
                        key={preset.hours}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setDraftDuration(preset.hours)}
                        style={{
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          backgroundColor: selected ? colors.primary : colors.card,
                          borderWidth: 1,
                          borderColor: selected ? colors.primary : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Poppins-SemiBold",
                            fontSize: 13,
                            color: selected ? "#F0EDE9" : colors.foreground,
                          }}
                        >
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>
      </SchedulePickerSheet>
    </>
  );
}
