/**
 * HeroDisplay — one e-ink screen that evolves through the focus journey.
 * Dynamic Island logic: same layout, same type scale, one primary read per phase.
 * Opted out of React Compiler: Reanimated `entering` plus hidden-tab reuse
 * crashed hero previews with "Expected staticflag was missing".
 */
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { HeroCardHeader } from "@/components/hero/HeroCardHeader";
import { HeroCounterProgress } from "@/components/hero/HeroCounterProgress";
import { HeroFlipClock, parseMmSsCountdown } from "@/components/hero/HeroFlipClock";
import { HeroHalftoneProgress } from "@/components/hero/HeroHalftoneProgress";
import { HeroVerifyingPulse } from "@/components/hero/HeroVerifyingPulse";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import {
  shouldShowHeroVerifyingPulse,
  type HeroDisplayModel,
} from "@/lib/heroDisplay";
import {
  HERO_DIGITAL_CLOCK_LINE_HEIGHT,
  HERO_DIGITAL_CLOCK_SIZE,
  HERO_EINK_BODY_GAP,
  HERO_SESSION_HEADING_LINE_HEIGHT,
  HERO_SESSION_HEADING_SIZE,
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
      variant="description"
      color="mutedWell"
      numberOfLines={2}
      style={{
        width: "100%",
        textAlign: "center",
        fontSize: 17,
        lineHeight: 21,
        paddingHorizontal: 8,
      }}
    >
      {children}
    </TrmnlText>
  );
}

function BodyLine({ children }: { children: string }) {
  return (
    <TrmnlText
      variant="description"
      color="ink"
      numberOfLines={2}
      style={{
        width: "100%",
        textAlign: "center",
        fontSize: 17,
        lineHeight: 21,
        paddingHorizontal: 8,
      }}
    >
      {children}
    </TrmnlText>
  );
}

type HeroDisplayBodyProps = {
  model: HeroDisplayModel;
  reduceMotion: boolean;
  onFootnotePress?: () => void;
};

/** Isolated so a motion-key remount does not sit on the same node as `entering`. */
function HeroDisplayBody({
  model,
  reduceMotion,
  onFootnotePress,
}: HeroDisplayBodyProps) {
  "use no memo";

  const progressFill = Math.min(Math.max(model.progressRatio ?? 0, 0), 1);
  const showProgress =
    model.phase !== "session" &&
    model.showProgress &&
    model.progressRatio != null &&
    model.progressRatio >= 0;
  const useHeadingPrimary = model.primaryPresentation === "heading";
  const useClockPrimary =
    !useHeadingPrimary &&
    (model.phase === "session" ||
      model.phase === "arrived" ||
      model.phase === "travel" ||
      model.phase === "waiting" ||
      model.phase === "idle");
  // Waiting uses HH:mm session time ("14:00") — never treat that as a MM:SS countdown.
  const useFlipClock =
    !useHeadingPrimary &&
    (model.phase === "session" || model.phase === "arrived") &&
    parseMmSsCountdown(model.primary) != null;
  const showVerifyingPulse = shouldShowHeroVerifyingPulse(model);

  const primaryRead = useFlipClock ? (
    <HeroFlipClock countdownLabel={model.primary} />
  ) : useHeadingPrimary ? (
    <TrmnlText
      variant="title"
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      style={{
        width: "100%",
        textAlign: "center",
        fontSize: HERO_SESSION_HEADING_SIZE,
        lineHeight: HERO_SESSION_HEADING_LINE_HEIGHT,
        paddingHorizontal: 12,
      }}
    >
      {model.primary}
    </TrmnlText>
  ) : useClockPrimary ? (
    <TrmnlText
      variant="countdown"
      numberOfLines={1}
      style={{
        width: "100%",
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
      style={{
        width: "100%",
        textAlign: "center",
        fontSize: 26,
        lineHeight: 28,
        paddingHorizontal: 8,
      }}
    >
      {model.primary}
    </TrmnlText>
  );

  return (
    <Animated.View
      entering={heroFocusEntering(reduceMotion)}
      style={{
        flex: 1,
        minHeight: 0,
        justifyContent: "center",
        paddingVertical: 6,
      }}
    >
      <View
        style={{
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: HERO_EINK_BODY_GAP + 2,
        }}
      >
        {model.eyebrow ? <DetailLine>{model.eyebrow}</DetailLine> : null}

        <HeroVerifyingPulse
          active={showVerifyingPulse}
          style={{ width: "100%", alignItems: "center" }}
        >
          {primaryRead}
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
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: "100%" })}
            >
              <DetailLine>{model.footnote}</DetailLine>
            </Pressable>
          ) : (
            <DetailLine>{model.footnote}</DetailLine>
          )
        ) : null}
      </View>
    </Animated.View>
  );
}

export function HeroDisplay({
  model,
  motionKey,
  reduceMotion,
  onFootnotePress,
  onCompleteDismiss,
}: HeroDisplayProps) {
  "use no memo";

  const showVerifyingPulse = shouldShowHeroVerifyingPulse(model);

  const content = (
    <View style={{ flex: 1, minHeight: 0 }}>
      <HeroCardHeader
        key={`${motionKey}-header`}
        sessionTitle=""
        metaLeft={{ label: model.kindLabel }}
        metaRight={{ label: model.statusLabel }}
        compact
        reduceMotion={reduceMotion}
        verifyPulse={showVerifyingPulse}
      />
      <HeroDisplayBody
        key={motionKey}
        model={model}
        reduceMotion={reduceMotion}
        onFootnotePress={onFootnotePress}
      />
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
