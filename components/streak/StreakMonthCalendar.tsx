/**
 * StreakMonthCalendar — month grid with connected daily-goal hits.
 * Inspired by habit-tracker streak UIs; uses Lowalk success green and streak orange.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import type { StreakCalendarCell, StreakMonthSummary } from "@/lib/streakCalendar";
import { useThemeColors } from "@/hooks/useThemeColors";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const CELL_SIZE = 38;

type StreakMonthCalendarProps = {
  month: StreakMonthSummary;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  canGoForward: boolean;
};

function DayCell({ cell }: { cell: StreakCalendarCell }) {
  const colors = useThemeColors();

  if (cell.day == null) {
    return (
      <View style={{ flex: 1, height: CELL_SIZE, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border,
            opacity: 0.35,
          }}
        />
      </View>
    );
  }

  const isHit = cell.goalHit;
  const isPartial = cell.status === "partial";
  const isToday = cell.status === "today";
  const isFuture = cell.status === "future";
  const isRest = cell.status === "rest";

  const fillColor = isHit ? colors.success : "transparent";
  const textColor = isHit
    ? colors.surface
    : isFuture || isRest
      ? colors.muted
      : colors.foreground;

  return (
    <View
      style={{
        flex: 1,
        height: CELL_SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {cell.connectLeft ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: "50%",
            top: CELL_SIZE / 2 - 10,
            height: 20,
            backgroundColor: "rgba(61, 185, 110, 0.28)",
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
          }}
        />
      ) : null}
      {cell.connectRight ? (
        <View
          style={{
            position: "absolute",
            left: "50%",
            right: 0,
            top: CELL_SIZE / 2 - 10,
            height: 20,
            backgroundColor: "rgba(61, 185, 110, 0.28)",
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
          }}
        />
      ) : null}

      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: fillColor,
          borderWidth: isPartial || (isToday && !isHit) ? 2 : 0,
          borderColor: isPartial
            ? colors.success
            : isToday
              ? colors.streak
              : "transparent",
        }}
      >
        <Text
          style={{
            fontFamily: isHit || isToday ? "Poppins-Bold" : "Poppins-Medium",
            fontSize: 13,
            lineHeight: 16,
            color: textColor,
            fontVariant: ["tabular-nums"],
          }}
        >
          {cell.day}
        </Text>
      </View>
    </View>
  );
}

export function StreakMonthCalendar({
  month,
  onPreviousMonth,
  onNextMonth,
  canGoForward,
}: StreakMonthCalendarProps) {
  const colors = useThemeColors();
  const rows: StreakCalendarCell[][] = [];

  for (let index = 0; index < month.cells.length; index += 7) {
    rows.push(month.cells.slice(index, index + 7));
  }

  return (
    <NeuCard contentStyle={{ paddingHorizontal: 14, paddingVertical: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={onPreviousMonth}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>

        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            lineHeight: 20,
            color: colors.foreground,
          }}
        >
          {month.monthLabel}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={onNextMonth}
          disabled={!canGoForward}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            opacity: !canGoForward ? 0.25 : pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {DAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontFamily: "Poppins-Medium",
                fontSize: 11,
                lineHeight: 14,
                color: colors.muted,
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 4 }}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={{ flexDirection: "row" }}>
            {row.map((cell, cellIndex) => (
              <DayCell key={cell.dateIso ?? `pad-${rowIndex}-${cellIndex}`} cell={cell} />
            ))}
          </View>
        ))}
      </View>
    </NeuCard>
  );
}
