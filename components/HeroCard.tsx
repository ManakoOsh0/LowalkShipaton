/**
 * Hero Card — one e-ink display that evolves through the focus journey.
 */
import { View } from "react-native";

import { HeroCardHeader } from "@/components/hero/HeroCardHeader";
import { HeroDisplay } from "@/components/hero/HeroDisplay";
import { HeroEinkRefresh } from "@/components/hero/HeroEinkRefresh";
import { HeroFocusLedger } from "@/components/hero/HeroFocusLedger";
import { HeroSoftButton } from "@/components/hero/HeroSoftButton";
import { HeroEinkFrame } from "@/components/HeroEinkFrame";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useHeroEinkRefresh, useReduceMotion } from "@/hooks/useHeroMotion";
import { getHeroPreviewReferenceDate } from "@/lib/heroCard";
import {
    buildHeroDisplayModel,
    buildHeroDisplayTransitionKey,
} from "@/lib/heroDisplay";
import {
    HERO_EINK_ACTIVE_HEADER_BLOCK,
    HERO_EINK_BODY_GAP,
    HERO_EINK_PADDING,
    getHeroBodyHeight,
} from "@/lib/heroEink";
import type { HeroCelebrationPayload } from "@/store/useHeroCelebrationStore";
import type { HeroAction, HeroCardData } from "@/types/dashboard";

const SCREEN_PADDING = 16;

type HeroCardProps = HeroCardData & {
  onActionPress?: (action: HeroAction) => void;
  onViewBlockedApps?: () => void;
  celebration?: HeroCelebrationPayload | null;
  onCelebrationDismiss?: () => void;
  /** Dev preview — uses a fixed reference clock for leave-by / start copy. */
  isPreview?: boolean;
};

export function HeroCard({
  state,
  title,
  action,
  focusLedger,
  context,
  nodeId,
  onActionPress,
  onViewBlockedApps,
  celebration,
  onCelebrationDismiss,
  isPreview = false,
  ...heroRest
}: HeroCardProps) {
  const reduceMotion = useReduceMotion();
  const heroData: HeroCardData = {
    state,
    title,
    action,
    focusLedger,
    context,
    nodeId,
    ...heroRest,
  };

  const motionSourceKey = celebration
    ? `celebration:${celebration.nodeId}:${celebration.createdAt}`
    : buildHeroDisplayTransitionKey(heroData, celebration);
  const { refreshActive, revealKey } = useHeroEinkRefresh(motionSourceKey, reduceMotion);

  const showLedger = state === "weekly_report" && Boolean(focusLedger);
  const footerAction =
    action != null ? (
      <HeroSoftButton
        label={action.label}
        onPress={() => onActionPress?.(action)}
      />
    ) : undefined;

  const displayModel = buildHeroDisplayModel(heroData, {
    celebration,
    referenceDate: isPreview ? getHeroPreviewReferenceDate() : undefined,
  });

  return (
    <View style={{ marginTop: 12, paddingHorizontal: SCREEN_PADDING }}>
      <HeroEinkFrame footer={footerAction}>
        <View style={{ flex: 1 }}>
          {showLedger && focusLedger && context ? (
            <View style={{ flex: 1, padding: HERO_EINK_PADDING, minHeight: 0 }}>
              <View style={{ height: HERO_EINK_ACTIVE_HEADER_BLOCK, overflow: "hidden" }}>
                <HeroCardHeader
                  sessionTitle=""
                  metaLeft={context.metaLeft}
                  metaRight={context.metaRight}
                  compact
                  motionKey={`${revealKey}-weekly`}
                  reduceMotion={reduceMotion}
                />
              </View>
              <View
                style={{
                  height: getHeroBodyHeight(true),
                  overflow: "hidden",
                  justifyContent: "space-between",
                  gap: HERO_EINK_BODY_GAP,
                }}
              >
                <View style={{ flex: 1, minHeight: 0 }}>
                  <HeroFocusLedger ledger={focusLedger} />
                </View>
              </View>
            </View>
          ) : celebration || context ? (
            <View style={{ flex: 1, padding: HERO_EINK_PADDING, minHeight: 0 }}>
              <HeroDisplay
                model={displayModel}
                motionKey={revealKey}
                reduceMotion={reduceMotion}
                onFootnotePress={
                  displayModel.phase === "session" ? onViewBlockedApps : undefined
                }
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
