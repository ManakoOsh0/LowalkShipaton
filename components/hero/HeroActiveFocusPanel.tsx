/**
 * HeroActiveFocusPanel — Desk Rhythm layout for in-session hero.
 * One focal countdown; shield is the only secondary slot.
 */
import Animated from "react-native-reanimated";

import { HeroContextZone, HeroFocalZone } from "@/components/hero/HeroBodyZones";
import { HeroShieldLine } from "@/components/hero/HeroShieldLine";
import { HeroTimerWell } from "@/components/hero/HeroTimerWell";
import { heroFocusEntering, heroFooterEntering } from "@/lib/heroMotion";
import type { HeroCardContext } from "@/types/dashboard";

type HeroActiveFocusPanelProps = {
  context: HeroCardContext;
  motionKey?: string;
  reduceMotion?: boolean;
  onViewBlockedApps?: () => void;
};

/** Active timer subline — on-site requirement only, not motivational copy. */
function activeTimerSubline(tagline: string | undefined): string | undefined {
  if (!tagline) return undefined;
  const lower = tagline.toLowerCase();
  if (lower.includes("on site") || lower.includes("on-site")) {
    return tagline;
  }
  return undefined;
}

export function HeroActiveFocusPanel({
  context,
  motionKey,
  reduceMotion = false,
  onViewBlockedApps,
}: HeroActiveFocusPanelProps) {
  const countdown = context.center.countdownLabel ?? context.center.headline;
  const progress = context.center.progressRatio ?? 0;
  const timerSubline = activeTimerSubline(context.tagline);

  return (
    <Animated.View
      key={motionKey ? `${motionKey}-active` : undefined}
      entering={heroFocusEntering(reduceMotion)}
      style={{ flex: 1, minHeight: 0 }}
    >
      <HeroFocalZone>
        <HeroTimerWell
          countdownLabel={countdown}
          subline={timerSubline}
          progressRatio={progress}
        />
      </HeroFocalZone>

      <HeroContextZone>
        {context.blockedAppsLabel ? (
          <Animated.View
            key={motionKey ? `${motionKey}-shield` : undefined}
            entering={heroFooterEntering(reduceMotion)}
          >
            <HeroShieldLine
              label={context.blockedAppsLabel}
              onPress={onViewBlockedApps}
            />
          </Animated.View>
        ) : null}
      </HeroContextZone>
    </Animated.View>
  );
}
