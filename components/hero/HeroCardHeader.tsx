/**
 * HeroCardHeader — compact meta row; title only when it adds context.
 */
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { HeroVerifyingPulse } from "@/components/hero/HeroVerifyingPulse";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { heroHeaderEntering } from "@/lib/heroMotion";
import type { HeroMetaChip } from "@/types/dashboard";

type HeroCardHeaderProps = {
  sessionTitle: string;
  metaLeft: HeroMetaChip;
  metaRight: HeroMetaChip;
  /** Active session — hide title; mode word lives in the body. */
  compact?: boolean;
  reduceMotion?: boolean;
  verifyPulse?: boolean;
};

export function HeroCardHeader({
  sessionTitle,
  metaLeft,
  metaRight,
  compact = false,
  reduceMotion = false,
  verifyPulse = false,
}: HeroCardHeaderProps) {
  "use no memo";

  return (
    <Animated.View
      entering={heroHeaderEntering(reduceMotion)}
      style={{ marginBottom: compact ? 2 : 1 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <TrmnlText variant="label" color="ink" numberOfLines={1} style={{ fontSize: 17, lineHeight: 21 }}>
          {metaLeft.label}
        </TrmnlText>
        <HeroVerifyingPulse active={verifyPulse}>
          <TrmnlText variant="label" color="ink" numberOfLines={1} style={{ fontSize: 17, lineHeight: 21 }}>
            {metaRight.label}
          </TrmnlText>
        </HeroVerifyingPulse>
      </View>

      <View
        style={{
          height: 1,
          marginTop: 2,
          marginBottom: compact ? 2 : 2,
          backgroundColor: "rgba(0, 0, 0, 0.22)",
          alignSelf: "stretch",
        }}
      />

      {!compact ? (
        <TrmnlText
          variant="title"
          numberOfLines={1}
          style={{ textAlign: "center", fontSize: 22, lineHeight: 24 }}
        >
          {sessionTitle}
        </TrmnlText>
      ) : null}
    </Animated.View>
  );
}
