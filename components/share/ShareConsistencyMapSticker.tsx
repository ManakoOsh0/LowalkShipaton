import { Text, View } from "react-native";

import { shareScale } from "@/lib/shareOverlay";
import { getShareMapStickerLayout } from "@/lib/shareOverlayMap";
import type {
  ShareOverlayContributionLevel,
  ShareOverlayContributionWeek,
} from "@/types/shareOverlay";

const MAP_BLUE = "#5B9BFF";

function levelColor(level: ShareOverlayContributionLevel): string {
  switch (level) {
    case 4:
      return MAP_BLUE;
    case 3:
      return "rgba(91, 155, 255, 0.75)";
    case 2:
      return "rgba(91, 155, 255, 0.5)";
    case 1:
      return "rgba(91, 155, 255, 0.28)";
    default:
      return "rgba(255, 255, 255, 0.14)";
  }
}

type ShareConsistencyMapStickerProps = {
  weeks: ShareOverlayContributionWeek[];
  activeDaysLast30: number;
  canvasWidth: number;
  /** Subtle drag affordance while editing in the composer. */
  interactive?: boolean;
};

/** Compact consistency heat-map sticker — floats on top of any share template. */
export function ShareConsistencyMapSticker({
  weeks,
  activeDaysLast30,
  canvasWidth,
  interactive = false,
}: ShareConsistencyMapStickerProps) {
  const layout = getShareMapStickerLayout(canvasWidth);
  const scale = shareScale(canvasWidth);
  const activeLabel = activeDaysLast30 === 1 ? "ACTIVE DAY" : "ACTIVE DAYS";

  return (
    <View
      style={{
        width: layout.width,
        height: layout.height,
        paddingHorizontal: layout.paddingH,
        paddingTop: layout.paddingV,
        paddingBottom: layout.paddingV,
        borderRadius: 12 * scale,
        borderCurve: "continuous",
        backgroundColor: "rgba(10, 10, 10, 0.55)",
        borderWidth: interactive ? 1.5 : 1,
        borderColor: interactive ? "rgba(91, 155, 255, 0.65)" : "rgba(255, 255, 255, 0.18)",
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: layout.labelHeight,
          lineHeight: layout.labelHeight + 2,
          color: MAP_BLUE,
          letterSpacing: 1.2,
          textAlign: "center",
        }}
      >
        {`${activeDaysLast30} ${activeLabel}`}
      </Text>

      <View
        style={{
          marginTop: layout.labelGap,
          flexDirection: "row",
          gap: layout.gap,
          justifyContent: "center",
        }}
      >
        {weeks.map((week) => (
          <View key={week.weekStartIso} style={{ gap: layout.gap }}>
            {week.days.map((day) => (
              <View
                key={day.dateIso}
                style={{
                  width: layout.cellSize,
                  height: layout.cellSize,
                  borderRadius: 2 * scale,
                  backgroundColor: levelColor(day.level),
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
