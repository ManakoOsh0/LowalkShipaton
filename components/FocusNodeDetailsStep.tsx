/**
 * Step 1 of Focus Node create/edit — identity and schedule in grouped cards.
 */
import { Pressable, Text, TextInput, View } from "react-native";

import { FocusNodeKindIcon } from "@/components/FocusNodeKindIcon";
import { InlineFieldError } from "@/components/form/InlineFieldError";
import { FormSectionCard } from "@/components/form/FormSectionCard";
import { ScheduleWhenCard } from "@/components/ScheduleWhenCard";
import { getKindAccentColor, getKindTintColor } from "@/lib/focusNodeKindColors";
import { ICON_TILE_RADIUS_MD } from "@/lib/cardStyle";
import type { ThemeColors } from "@/theme/tokens";
import type { FocusNodeKind, Weekday } from "@/types/focusNode";

const KIND_OPTIONS: FocusNodeKind[] = ["class", "gym", "library", "custom"];

const KIND_LABELS: Record<FocusNodeKind, string> = {
  class: "Class",
  gym: "Gym",
  library: "Library",
  custom: "Custom",
};

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

type FocusNodeDetailsStepProps = {
  kind: FocusNodeKind;
  showTypePicker: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  roomLabel: string;
  onRoomLabelChange: (value: string) => void;
  weekdays: Weekday[];
  onWeekdaysChange: (value: Weekday[]) => void;
  allowMultipleWeekdays?: boolean;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  durationHours: number;
  onDurationHoursChange: (value: number) => void;
  onKindChange: (value: FocusNodeKind) => void;
  titleError?: string;
  colors: ThemeColors;
};

export function FocusNodeDetailsStep({
  kind,
  showTypePicker,
  title,
  onTitleChange,
  roomLabel,
  onRoomLabelChange,
  weekdays,
  onWeekdaysChange,
  allowMultipleWeekdays = false,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  durationHours,
  onDurationHoursChange,
  onKindChange,
  titleError,
  colors,
}: FocusNodeDetailsStepProps) {
  const usesClassSchedule = kind === "class";
  const titleLabel = usesClassSchedule ? "Class name" : "Title";

  return (
    <View style={{ gap: 20 }}>
      {showTypePicker ? (
        <FormSectionCard title="Type">
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 12,
              gap: 8,
            }}
          >
            {KIND_OPTIONS.map((option) => {
              const selected = option === kind;
              const accent = getKindAccentColor(option);
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={KIND_LABELS[option]}
                  onPress={() => onKindChange(option)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 4,
                    opacity: selected ? 1 : 0.72,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: ICON_TILE_RADIUS_MD,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selected ? getKindTintColor(option, 0.28) : getKindTintColor(option),
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? accent : colors.border,
                    }}
                  >
                    <FocusNodeKindIcon kind={option} size={22} color={accent} />
                  </View>
                  <Text
                    style={{
                      fontFamily: selected ? "Poppins-SemiBold" : "Poppins-Regular",
                      fontSize: 11,
                      color: selected ? colors.foreground : colors.muted,
                    }}
                  >
                    {KIND_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </FormSectionCard>
      ) : null}

      <FormSectionCard
        title="What"
        footer={titleError ? <InlineFieldError message={titleError} /> : null}
      >
        <View style={{ gap: 12, paddingVertical: 8 }}>
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              {titleLabel}
            </Text>
            <TextInput
              value={title}
              onChangeText={onTitleChange}
              placeholder={usesClassSchedule ? "e.g. Stats Lecture" : "e.g. Library Session"}
              placeholderTextColor={colors.muted}
              style={inputStyle(colors)}
            />
          </View>

          {usesClassSchedule ? (
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.muted,
                }}
              >
                Room (optional)
              </Text>
              <TextInput
                value={roomLabel}
                onChangeText={onRoomLabelChange}
                placeholder="e.g. IT 4-1"
                placeholderTextColor={colors.muted}
                style={inputStyle(colors)}
              />
            </View>
          ) : null}
        </View>
      </FormSectionCard>

      <ScheduleWhenCard
        weekdays={weekdays}
        onWeekdaysChange={onWeekdaysChange}
        allowMultipleWeekdays={allowMultipleWeekdays}
        startTime={startTime}
        onStartTimeChange={onStartTimeChange}
        endTime={endTime}
        onEndTimeChange={onEndTimeChange}
        durationHours={durationHours}
        onDurationHoursChange={onDurationHoursChange}
        usesClassSchedule={usesClassSchedule}
        colors={colors}
      />
    </View>
  );
}
