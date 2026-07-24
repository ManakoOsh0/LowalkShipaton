/**
 * Contribution heatmap — GitHub-style activity grid for focus consistency.
 * Color intensity reflects sessions completed; deepest shade means daily target hit.
 */
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import {
  getContributionLevelColor,
  type ContributionWeek,
} from "@/lib/consistencyStats";
import { useThemeColors } from "@/hooks/useThemeColors";

const CELL_GAP = 3;
const CELL_SIZE = 11;
const ROW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type ContributionHeatmapProps = {
  weeks: ContributionWeek[];
};

export function ContributionHeatmap({ weeks }: ContributionHeatmapProps) {
  const colors = useThemeColors();

  return (
    <NeuCard
      contentStyle={{
        paddingHorizontal: 16,
        paddingVertical: 18,
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 16,
          lineHeight: 22,
          color: colors.foreground,
        }}
      >
        Your focus journey
      </Text>
      <Text
        style={{
          marginTop: 4,
          marginBottom: 16,
          fontFamily: "Poppins-Regular",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        Each square is a day. Deeper purple means more sessions protected.
      </Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ paddingTop: 2, gap: CELL_GAP }}>
          {ROW_LABELS.map((label, index) => (
            <View
              key={`${label}-${index}`}
              style={{
                height: CELL_SIZE,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 9,
                  lineHeight: 12,
                  color: colors.muted,
                  width: 10,
                }}
              >
                {index % 2 === 0 ? label : ""}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, flexDirection: "row", gap: CELL_GAP }}>
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
                    backgroundColor: getContributionLevelColor(day.level, colors),
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <View
        style={{
          marginTop: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 6,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 11,
            color: colors.muted,
          }}
        >
          Less
        </Text>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <View
            key={level}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: getContributionLevelColor(level, colors),
            }}
          />
        ))}
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 11,
            color: colors.muted,
          }}
        >
          More
        </Text>
      </View>
    </NeuCard>
  );
}
