/**
 * HeroCelebrationBeat — short-lived session-complete moment inside the hero shell.
 * Mirrors idle/active hero layout: meta header, focal mark, supporting copy.
 */
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { HeroCardHeader } from "@/components/hero/HeroCardHeader";
import { HeroSessionCompleteIcon } from "@/components/HeroSessionCompleteIcon";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import {
  arrivalMascotEntering,
  heroFocusEntering,
  heroFooterEntering,
} from "@/lib/heroMotion";
import type { HeroCelebrationPayload } from "@/store/useHeroCelebrationStore";

type HeroCelebrationBeatProps = {
  celebration: HeroCelebrationPayload;
  onDismiss: () => void;
  motionKey?: string;
};

export function HeroCelebrationBeat({
  celebration,
  onDismiss,
  motionKey,
}: HeroCelebrationBeatProps) {
  const reduceMotion = useReduceMotion();
  const headerKey = motionKey ? `${motionKey}-header` : undefined;
  const focusKey = motionKey ? `${motionKey}-focus` : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Dismiss session complete message"
      onPress={onDismiss}
      style={{ flex: 1, minHeight: 0 }}
    >
      <View style={{ flex: 1, justifyContent: "space-between", minHeight: 0, gap: 4 }}>
        <HeroCardHeader
          key={headerKey}
          sessionTitle={celebration.nodeTitle}
          metaLeft={{ label: "SESSION" }}
          metaRight={{ label: "SECURED" }}
          compact
          reduceMotion={reduceMotion}
        />

        <Animated.View
          key={focusKey}
          entering={heroFocusEntering(reduceMotion)}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 4,
          }}
        >
          <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
            <HeroSessionCompleteIcon size={52} />
          </Animated.View>

          <View style={{ alignItems: "center", gap: 4, paddingHorizontal: 8 }}>
            <TrmnlText variant="title" style={{ textAlign: "center" }}>
              Focus secured
            </TrmnlText>
            <TrmnlText
              variant="labelSmall"
              color="mutedWell"
              numberOfLines={2}
              style={{ textAlign: "center" }}
            >
              {celebration.nodeTitle}
            </TrmnlText>
            {celebration.hitDailyGoal ? (
              <TrmnlText variant="labelSmall" style={{ textAlign: "center" }}>
                Daily goal reached
              </TrmnlText>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={heroFooterEntering(reduceMotion)}>
          <TrmnlText
            variant="labelSmall"
            color="mutedWell"
            style={{ textAlign: "center" }}
          >
            Tap to continue
          </TrmnlText>
        </Animated.View>
      </View>
    </Pressable>
  );
}
