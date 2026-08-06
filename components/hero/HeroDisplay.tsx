/**
 * HeroDisplay — one e-ink screen that evolves through the focus journey.
 * Dynamic Island logic: same layout, same type scale, one primary read per phase.
 */
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { HeroCardHeader } from "@/components/hero/HeroCardHeader";
import { HeroCounterProgress } from "@/components/hero/HeroCounterProgress";
import { HeroFlipClock } from "@/components/hero/HeroFlipClock";
import { HeroHalftoneProgress } from "@/components/hero/HeroHalftoneProgress";
import { HeroKaomoji } from "@/components/hero/HeroKaomoji";
import { HeroVerifyingPulse } from "@/components/hero/HeroVerifyingPulse";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import type { HeroDisplayModel } from "@/lib/heroDisplay";
import {
    HERO_DIGITAL_CLOCK_LINE_HEIGHT,
    HERO_DIGITAL_CLOCK_SIZE,
    HERO_EINK_BODY_GAP,
} from "@/lib/heroEink";
import { heroFocusEntering } from "@/lib/heroMotion";

type HeroDisplayProps = {
  model: HeroDisplayModel;
  motionKey: string;
  reduceMotion: boolean;
  onFootnotePress?: () => void;
  onCompleteDismiss?: () => void;
};

function DetailLine({ children }: { children: string }) {
  return (
    <TrmnlText
      variant="labelSmall"
      color="mutedWell"
      numberOfLines={2}
      style={{ textAlign: "center", fontSize: 14, lineHeight: 16 }}
    >
      {children}
    </TrmnlText>
  );
}

function BodyLine({ children }: { children: string }) {
  return (
    <TrmnlText
      variant="labelSmall"
      color="ink"
      numberOfLines={2}
      style={{ textAlign: "center", fontSize: 14, lineHeight: 16 }}
    >
      {children}
    </TrmnlText>
  );
}

export function HeroDisplay({
  model,
  motionKey,
  reduceMotion,
  onFootnotePress,
  onCompleteDismiss,
}: HeroDisplayProps) {
  const progressFill = Math.min(Math.max(model.progressRatio ?? 0, 0), 1);
  const showProgress =
    model.phase !== "session" &&
    model.showProgress &&
    model.progressRatio != null &&
    model.progressRatio >= 0;
  const useClockPrimary =
    model.phase === "session" ||
    model.phase === "arrived" ||
    model.phase === "travel" ||
    model.phase === "waiting" ||
    model.phase === "idle";

  const body = (
    <Animated.View
      key={motionKey}
      entering={heroFocusEntering(reduceMotion)}
      style={{
        flex: 1,
        minHeight: 0,
        alignItems: "center",
        justifyContent: "center",
        gap: HERO_EINK_BODY_GAP + 2,
        paddingVertical: 4,
      }}
    >
      {model.phase === "complete" ? (
        <HeroKaomoji
          phase="complete"
          reduceMotion={reduceMotion}
          motionKey={motionKey}
        />
      ) : null}

      {model.eyebrow ? <DetailLine>{model.eyebrow}</DetailLine> : null}

      <HeroVerifyingPulse active={model.verifyPulse}>
        {model.phase === "session" ? (
          <HeroFlipClock
            countdownLabel={model.primary}
            sessionTitle={model.secondary}
            locationLabel={model.tertiary}
            footnote={model.footnote}
            onFootnotePress={onFootnotePress}
            kindLabel={model.kindLabel}
            motionKey={motionKey}
          />
        ) : model.phase === "travel" ||
          model.phase === "arrived" ||
          model.phase === "idle" ||
          model.phase === "waiting" ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <HeroKaomoji
              phase={model.phase}
              reduceMotion={reduceMotion}
              verifyPulse={model.verifyPulse}
              idleMood={model.idleMood}
              waitingMood={model.waitingMood}
              motionKey={motionKey}
            />
            <TrmnlText
              variant="countdown"
              numberOfLines={1}
              style={{
                textAlign: "center",
                fontSize: HERO_DIGITAL_CLOCK_SIZE,
                lineHeight: HERO_DIGITAL_CLOCK_LINE_HEIGHT,
              }}
            >
              {model.primary}
            </TrmnlText>
          </View>
        ) : useClockPrimary ? (
          <TrmnlText
            variant="countdown"
            numberOfLines={1}
            style={{
              textAlign: "center",
              fontSize: HERO_DIGITAL_CLOCK_SIZE,
              lineHeight: HERO_DIGITAL_CLOCK_LINE_HEIGHT,
            }}
          >
            {model.primary}
          </TrmnlText>
        ) : (
          <TrmnlText
            variant="title"
            numberOfLines={2}
            style={{ textAlign: "center", fontSize: 22, lineHeight: 24 }}
          >
            {model.primary}
          </TrmnlText>
        )}
      </HeroVerifyingPulse>

      {showProgress ? (
        <View style={{ width: "100%", marginTop: 2 }}>
          {model.phase === "travel" || model.phase === "arrived" ? (
            <HeroHalftoneProgress progressRatio={progressFill} />
          ) : (
            <HeroCounterProgress progressRatio={progressFill} />
          )}
        </View>
      ) : null}

      {model.phase !== "session" && model.secondary ? (
        <BodyLine>{model.secondary}</BodyLine>
      ) : null}
      {model.phase !== "session" && model.tertiary ? (
        <DetailLine>{model.tertiary}</DetailLine>
      ) : null}
      {model.phase !== "session" && model.detail ? (
        <DetailLine>{model.detail}</DetailLine>
      ) : null}

      {model.phase !== "session" && model.footnote ? (
        onFootnotePress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onFootnotePress}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 2 })}
          >
            <DetailLine>{model.footnote}</DetailLine>
          </Pressable>
        ) : (
          <DetailLine>{model.footnote}</DetailLine>
        )
      ) : null}
    </Animated.View>
  );

  const content = (
    <View style={{ flex: 1, minHeight: 0 }}>
      <HeroCardHeader
        sessionTitle=""
        metaLeft={{ label: model.kindLabel }}
        metaRight={{ label: model.statusLabel }}
        compact
        motionKey={`${motionKey}-header`}
        reduceMotion={reduceMotion}
        verifyPulse={model.verifyPulse}
      />
      {body}
    </View>
  );

  if (model.phase === "complete" && onCompleteDismiss) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss session complete message"
        onPress={onCompleteDismiss}
        style={{ flex: 1, minHeight: 0 }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
