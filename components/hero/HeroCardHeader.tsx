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
  motionKey?: string;
  reduceMotion?: boolean;
  verifyPulse?: boolean;
};

export function HeroCardHeader({
  sessionTitle,
  metaLeft,
  metaRight,
  compact = false,
  motionKey,
  reduceMotion = false,
  verifyPulse = false,
}: HeroCardHeaderProps) {
  return (
    <Animated.View
      key={motionKey ? `${motionKey}-header` : undefined}
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
        <TrmnlText variant="labelSmall" color="ink" numberOfLines={1}>
          {metaLeft.label}
        </TrmnlText>
        <HeroVerifyingPulse active={verifyPulse}>
          <TrmnlText variant="labelSmall" color="ink" numberOfLines={1}>
            {metaRight.label}
          </TrmnlText>
        </HeroVerifyingPulse>
      </View>

      <View
        style={{
          height: 1,
          marginTop: 2,
          marginBottom: compact ? 2 : 2,
          backgroundColor: "rgba(0, 0, 0, 0.16)",
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
