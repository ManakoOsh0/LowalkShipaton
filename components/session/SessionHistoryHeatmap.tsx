/**
 * SessionHistoryHeatmap — contribution grid for one Focus Node's completion history.
 */
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import type { FocusNodeContributionWeek } from "@/lib/focusNodeStats";
import { useThemeColors } from "@/hooks/useThemeColors";

const CELL_GAP = 3;
const CELL_SIZE = 11;
const ROW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type SessionHistoryHeatmapProps = {
  weeks: FocusNodeContributionWeek[];
  accentColor: string;
};

function parseIsoMonth(iso: string): string {
  const date = new Date(iso + "T12:00:00");
  return date.toLocaleDateString(undefined, { month: "short" });
}

export function SessionHistoryHeatmap({ weeks, accentColor }: SessionHistoryHeatmapProps) {
  const colors = useThemeColors();

  const monthMarkers = weeks.map((week, index) => {
    const month = parseIsoMonth(week.weekStartIso);
    const prevMonth = index > 0 ? parseIsoMonth(weeks[index - 1].weekStartIso) : null;
    return { month, show: month !== prevMonth };
  });

  return (
    <NeuCard borderRadius={18} contentStyle={{ paddingHorizontal: 16, paddingVertical: 18 }}>
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 17,
          lineHeight: 22,
          color: colors.foreground,
        }}
      >
        History
      </Text>

      <View style={{ marginTop: 16, flexDirection: "row", gap: 8 }}>
        <View style={{ width: 12, paddingTop: 14, gap: CELL_GAP }}>
          {ROW_LABELS.map((label, index) => (
            <View
              key={`${label}-${index}`}
              style={{ height: CELL_SIZE, justifyContent: "center" }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 9,
                  lineHeight: 12,
                  color: colors.muted,
                }}
              >
                {index % 2 === 0 ? label : ""}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", gap: CELL_GAP, marginBottom: 6, height: 12 }}>
            {monthMarkers.map((marker, index) => (
              <View key={`${weeks[index].weekStartIso}-month`} style={{ flex: 1 }}>
                {marker.show ? (
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 9,
                      lineHeight: 12,
                      color: colors.muted,
                    }}
                  >
                    {marker.month}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: CELL_GAP }}>
            {weeks.map((week) => (
              <View key={week.weekStartIso} style={{ flex: 1, gap: CELL_GAP }}>
                {week.days.map((day) => (
                  <View
                    key={day.dateIso}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      maxHeight: CELL_SIZE,
                      minHeight: CELL_SIZE,
                      borderRadius: 3,
                      backgroundColor: day.completed ? accentColor : colors.border,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </NeuCard>
  );
}
