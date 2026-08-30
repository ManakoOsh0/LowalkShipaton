/**
 * Today consistency receipt — showed up, places visited, planned vs focused time.
 * Lives on Stats only; Home still answers "what next?"
 */
import { Text, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_MD } from "@/lib/cardStyle";
import { formatFocusDuration } from "@/lib/periodStats";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";
import type { ConsistencyRecap } from "@/types/stats";

type StatsTodayRecapProps = {
  recap: ConsistencyRecap;
};

function RecapRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <Text style={[textStyle("bodyMd", colors.muted), { flexShrink: 0 }]}>
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          textAlign: "right",
          fontFamily: FONT_FAMILY.semibold,
          fontSize: 15,
          lineHeight: 22,
          color: muted ? colors.muted : colors.foreground,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function StatsTodayRecap({ recap }: StatsTodayRecapProps) {
  const colors = useThemeColors();
  const hasPlan = recap.sessionsPlanned > 0;
  const places =
    recap.placesVisited.length > 0 ? recap.placesVisited.join(" · ") : "—";
  const timeKeptPercent =
    recap.plannedMinutes > 0
      ? Math.round((recap.focusMinutes / recap.plannedMinutes) * 100)
      : 0;
  const showTimeKept =
    hasPlan && recap.sessionsCompleted > 0 && timeKeptPercent < 100;

  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontFamily: FONT_FAMILY.semibold,
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1.4,
          color: colors.muted,
          textTransform: "uppercase",
        }}
      >
        {recap.title}
      </Text>

      <View
        style={{
          borderRadius: CARD_RADIUS_MD,
          borderCurve: "continuous",
          backgroundColor: colors.card,
          paddingHorizontal: 18,
          paddingVertical: 18,
          gap: 14,
        }}
      >
        {!hasPlan ? (
          <Text style={textStyle("bodyMd", colors.muted)}>{recap.emptyMessage}</Text>
        ) : (
          <>
            <RecapRow
              label="Sessions completed"
              value={`${recap.sessionsCompleted}/${recap.sessionsPlanned}`}
            />
            <RecapRow label="Places visited" value={places} />
            <RecapRow
              label="Focus time"
              value={formatFocusDuration(recap.focusMinutes)}
            />
            <RecapRow
              label="Planned time"
              value={formatFocusDuration(recap.plannedMinutes)}
              muted
            />
            {showTimeKept ? (
              <RecapRow
                label="Time kept"
                value={`${timeKeptPercent}%`}
                muted
              />
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
