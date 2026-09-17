/**
 * Hero Card — one e-ink display that evolves through the focus journey.
 */
import { View } from "react-native";

import { HeroDisplay } from "@/components/hero/HeroDisplay";
import { HeroEinkRefresh } from "@/components/hero/HeroEinkRefresh";
import { HeroEinkFrame } from "@/components/HeroEinkFrame";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useHeroEinkRefresh, useReduceMotion } from "@/hooks/useHeroMotion";
import { getHeroPreviewReferenceDate } from "@/lib/heroCard";
import {
  buildHeroDisplayModel,
  buildHeroDisplayTransitionKey,
} from "@/lib/heroDisplay";
import { HERO_EINK_PADDING } from "@/lib/heroEink";
import type { HeroCelebrationPayload } from "@/store/useHeroCelebrationStore";
import type { HeroCardData } from "@/types/dashboard";

const SCREEN_PADDING = 16;

type HeroCardProps = HeroCardData & {
  celebration?: HeroCelebrationPayload | null;
  onCelebrationDismiss?: () => void;
  /** Dev preview — uses a fixed reference clock for leave-by / start copy. */
  isPreview?: boolean;
};

export function HeroCard({
  state,
  title,
  context,
  nodeId,
  celebration,
  onCelebrationDismiss,
  isPreview = false,
  ...heroRest
}: HeroCardProps) {
  const reduceMotion = useReduceMotion();
  const heroData: HeroCardData = {
    state,
    title,
    context,
    nodeId,
    ...heroRest,
  };

  const motionSourceKey = celebration
    ? `celebration:${celebration.nodeId}:${celebration.createdAt}`
    : buildHeroDisplayTransitionKey(heroData, celebration);

  const { refreshActive, revealKey } = useHeroEinkRefresh(motionSourceKey, reduceMotion);

  const displayModel = buildHeroDisplayModel(heroData, {
    celebration,
    referenceDate: isPreview ? getHeroPreviewReferenceDate() : undefined,
  });

  return (
    <View style={{ marginTop: 12, paddingHorizontal: SCREEN_PADDING }}>
      <HeroEinkFrame>
        <View style={{ flex: 1 }}>
          {celebration || context ? (
            <View style={{ flex: 1, padding: HERO_EINK_PADDING, minHeight: 0 }}>
              <HeroDisplay
                model={displayModel}
                motionKey={revealKey}
                reduceMotion={reduceMotion}
                onCompleteDismiss={onCelebrationDismiss}
              />
            </View>
          ) : (
            <View style={{ flex: 1, padding: HERO_EINK_PADDING, justifyContent: "center" }}>
              <TrmnlText variant="title" numberOfLines={2} style={{ textAlign: "center" }}>
                {title}
              </TrmnlText>
            </View>
          )}

          <HeroEinkRefresh active={refreshActive} />
        </View>
      </HeroEinkFrame>
    </View>
  );
}
