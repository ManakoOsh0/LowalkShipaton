/**
 * HeroCounterProgress — dense vertical segment track for session countdowns.
 * Filled segments are solid ink; unfilled segments use a TRMNL halftone dither.
 */
import { View } from "react-native";

import {
  HERO_COUNTER_SEGMENT_COUNT,
  HERO_COUNTER_SEGMENT_GAP,
  HERO_COUNTER_SEGMENT_HEIGHT,
  TRMNL_THEME,
} from "@/lib/heroEink";

type HeroCounterProgressProps = {
  progressRatio: number;
};

function DitheredSegment() {
  const rows = 5;
  const cols = 2;

  return (
    <View
      style={{
        flex: 1,
        height: HERO_COUNTER_SEGMENT_HEIGHT,
        borderRadius: 999,
        overflow: "hidden",
        justifyContent: "space-evenly",
        alignItems: "center",
        paddingHorizontal: 1,
      }}
    >
      {Array.from({ length: rows }, (_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            paddingHorizontal: 1,
          }}
        >
          {Array.from({ length: cols }, (_, col) => (
            <View
              key={col}
              style={{
                width: 2,
                height: 2,
                borderRadius: 1,
                backgroundColor: TRMNL_THEME.textPrimary,
                opacity: (row + col) % 2 === 0 ? 0.5 : 0.22,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function CounterSegment({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <View
        style={{
          flex: 1,
          height: HERO_COUNTER_SEGMENT_HEIGHT,
          borderRadius: 999,
          backgroundColor: TRMNL_THEME.textPrimary,
        }}
      />
    );
  }

  return <DitheredSegment />;
}

export function HeroCounterProgress({ progressRatio }: HeroCounterProgressProps) {
  const clamped = Math.min(Math.max(progressRatio, 0), 1);
  const filledCount = Math.round(clamped * HERO_COUNTER_SEGMENT_COUNT);

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: HERO_COUNTER_SEGMENT_GAP,
      }}
    >
      {Array.from({ length: HERO_COUNTER_SEGMENT_COUNT }, (_, index) => (
        <CounterSegment key={index} filled={index < filledCount} />
      ))}
    </View>
  );
}
