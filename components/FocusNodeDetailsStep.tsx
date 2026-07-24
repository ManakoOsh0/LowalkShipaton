/**
 * Step 1 of Focus Node create/edit — identity and schedule only (no venue).
 */
import { Pressable, Text, TextInput, View } from "react-native";

import {
  ScheduleSessionTimeField,
  ScheduleTimeRangeField,
} from "@/components/ScheduleTimeFields";
import type { ThemeColors } from "@/theme/tokens";
import type { FocusNodeKind, Weekday } from "@/types/focusNode";

const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const KIND_OPTIONS: FocusNodeKind[] = ["class", "gym", "library", "custom"];

function inputStyle(colors: ThemeColors) {
  return {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins-Regular" as const,
    fontSize: 15,
    color: colors.foreground,
  };
}

function FieldLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text
      style={{
        fontFamily: "Poppins-SemiBold",
        fontSize: 13,
        lineHeight: 18,
        color,
      }}
    >
      {label}
    </Text>
  );
}

type FocusNodeDetailsStepProps = {
  kind: FocusNodeKind;
  showTypePicker: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  roomLabel: string;
  onRoomLabelChange: (value: string) => void;
  weekday: Weekday;
  onWeekdayChange: (value: Weekday) => void;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  durationHours: number;
  onDurationHoursChange: (value: number) => void;
  onKindChange: (value: FocusNodeKind) => void;
  colors: ThemeColors;
};

export function FocusNodeDetailsStep({
  kind,
  showTypePicker,
  title,
  onTitleChange,
  roomLabel,
  onRoomLabelChange,
  weekday,
  onWeekdayChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  durationHours,
  onDurationHoursChange,
  onKindChange,
  colors,
}: FocusNodeDetailsStepProps) {
  const usesClassSchedule = kind === "class";

  return (
    <View style={{ gap: 16 }}>
      <FieldLabel
        label={usesClassSchedule ? "Class name" : "Title"}
        color={colors.muted}
      />
      <TextInput
        value={title}
        onChangeText={onTitleChange}
        placeholder={usesClassSchedule ? "e.g. Stats Lecture" : "e.g. Library Session"}
        placeholderTextColor={colors.muted}
        style={inputStyle(colors)}
      />

      {showTypePicker ? (
        <>
          <FieldLabel label="Type" color={colors.muted} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {KIND_OPTIONS.map((option) => {
              const selected = option === kind;
              return (
                <Pressable
                  key={option}
                  onPress={() => onKindChange(option)}
                  style={{
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: selected ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 13,
                      color: selected ? "#F0EDE9" : colors.foreground,
                      textTransform: "capitalize",
                    }}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {usesClassSchedule ? (
        <>
          <FieldLabel label="Room / hall" color={colors.muted} />
          <TextInput
            value={roomLabel}
            onChangeText={onRoomLabelChange}
            placeholder="e.g. IT 4-1"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
          />
        </>
      ) : null}

      <FieldLabel label="Day" color={colors.muted} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {WEEKDAY_OPTIONS.map((option) => {
          const selected = option.value === weekday;
          return (
            <Pressable
              key={option.value}
              onPress={() => onWeekdayChange(option.value)}
              style={{
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: selected ? colors.primary : colors.background,
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
      </View>

      {usesClassSchedule ? (
        <ScheduleTimeRangeField
          startTime={startTime}
          endTime={endTime}
          onChangeStartTime={onStartTimeChange}
          onChangeEndTime={onEndTimeChange}
          colors={colors}
        />
      ) : (
        <ScheduleSessionTimeField
          startTime={startTime}
          durationHours={durationHours}
          onChangeStartTime={onStartTimeChange}
          onChangeDurationHours={onDurationHoursChange}
          colors={colors}
        />
      )}
    </View>
  );
}
