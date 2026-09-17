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
import { HeroFlipClock } from "@/components/hero/HeroFlipClock";
import { parseClockPair } from "@/lib/heroFlipClock";
import { HeroHalftoneProgress } from "@/components/hero/HeroHalftoneProgress";
import { HeroVerifyingPulse } from "@/components/hero/HeroVerifyingPulse";
import { HeroSessionCompleteIcon } from "@/components/HeroSessionCompleteIcon";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import {
  shouldShowHeroVerifyingPulse,
  type HeroDisplayModel,
} from "@/lib/heroDisplay";
import {
  HERO_CELEBRATION_BODY_LINE_HEIGHT,
  HERO_CELEBRATION_BODY_SIZE,
  HERO_CELEBRATION_HEADLINE_LINE_HEIGHT,
  HERO_CELEBRATION_HEADLINE_SIZE,
  HERO_CELEBRATION_ICON_SIZE,
  HERO_DIGITAL_CLOCK_LINE_HEIGHT,
  HERO_DIGITAL_CLOCK_SIZE,
  HERO_EINK_BODY_GAP,
  HERO_IDLE_HEADLINE_LINE_HEIGHT,
  HERO_IDLE_HEADLINE_SIZE,
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
      color="ink"
      numberOfLines={2}
      style={{
        width: "100%",
        textAlign: "center",
        fontSize: 18,
        lineHeight: 22,
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
        fontSize: 18,
        lineHeight: 22,
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

/** Up-next metadata — pinned so the flip clock can share the active-session center line. */
function WaitingContextFooter({
  model,
  onFootnotePress,
}: {
  model: HeroDisplayModel;
  onFootnotePress?: () => void;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        gap: HERO_EINK_BODY_GAP,
        paddingBottom: 2,
      }}
    >
      {model.tertiary ? <DetailLine>{model.tertiary}</DetailLine> : null}
      {model.detail ? <DetailLine>{model.detail}</DetailLine> : null}
      {model.footnote ? (
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
  );
}

/** Isolated so a motion-key remount does not sit on the same node as `entering`. */
function HeroDisplayBody({
  model,
  reduceMotion,
  onFootnotePress,
}: HeroDisplayBodyProps) {
  "use no memo";

  const isArrivedVerify =
    model.phase === "arrived" && model.arrivedMoment === "verify";
  const progressFill = Math.min(Math.max(model.progressRatio ?? 0, 0), 1);
  const showProgress =
    model.phase !== "session" &&
    model.showProgress &&
    model.progressRatio != null &&
    model.progressRatio >= 0;
  const useHeadingPrimary = model.primaryPresentation === "heading";
  const useFlipClock =
    !useHeadingPrimary &&
    !isArrivedVerify &&
    (model.phase === "session" ||
      model.phase === "arrived" ||
      model.phase === "waiting") &&
    parseClockPair(model.primary) != null;
  const useClockPrimary =
    !useHeadingPrimary &&
    !useFlipClock &&
    !isArrivedVerify &&
    (model.phase === "session" ||
      model.phase === "arrived" ||
      model.phase === "travel");
  const showVerifyingPulse = shouldShowHeroVerifyingPulse(model);

  const primaryRead = useFlipClock ? (
    <HeroFlipClock
      countdownLabel={model.primary}
      static={model.phase === "waiting"}
    />
  ) : useHeadingPrimary ? (
    <TrmnlText
      variant="title"
      numberOfLines={2}
      adjustsFontSizeToFit={model.phase === "idle"}
      minimumFontScale={model.phase === "idle" ? 0.82 : 0.72}
      style={{
        width: "100%",
        textAlign: "center",
        fontSize:
          model.phase === "idle"
            ? HERO_IDLE_HEADLINE_SIZE
            : HERO_SESSION_HEADING_SIZE,
        lineHeight:
          model.phase === "idle"
            ? HERO_IDLE_HEADLINE_LINE_HEIGHT
            : HERO_SESSION_HEADING_LINE_HEIGHT,
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

  const isClockCentricBody =
    model.phase === "session" ||
    (model.phase === "waiting" && useFlipClock);

  const contextLines =
    model.phase !== "session" && model.phase !== "waiting" ? (
      <>
        {model.secondary ? <BodyLine>{model.secondary}</BodyLine> : null}
        {model.tertiary ? <DetailLine>{model.tertiary}</DetailLine> : null}
        {model.detail ? <DetailLine>{model.detail}</DetailLine> : null}
        {model.footnote ? (
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
      </>
    ) : null;

  if (isClockCentricBody) {
    return (
      <Animated.View
        entering={heroFocusEntering(reduceMotion)}
        style={{
          flex: 1,
          minHeight: 0,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 6,
          // Keep the flip clock on the active-session center line; footer copy is overlaid.
          paddingBottom: model.phase === "waiting" ? 78 : 6,
        }}
      >
        <HeroVerifyingPulse
          active={showVerifyingPulse}
          style={{ width: "100%", alignItems: "center" }}
        >
          {primaryRead}
        </HeroVerifyingPulse>
      </Animated.View>
    );
  }

  if (model.phase === "complete") {
    return (
      <Animated.View
        entering={heroFocusEntering(reduceMotion)}
        style={{
          flex: 1,
          minHeight: 0,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 4,
        }}
      >
        <View
          style={{
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: HERO_EINK_BODY_GAP + 4,
          }}
        >
          {model.showCheckmark ? (
            <HeroSessionCompleteIcon size={HERO_CELEBRATION_ICON_SIZE} />
          ) : null}

          <TrmnlText
            variant="title"
            numberOfLines={2}
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: HERO_CELEBRATION_HEADLINE_SIZE,
              lineHeight: HERO_CELEBRATION_HEADLINE_LINE_HEIGHT,
              paddingHorizontal: 8,
            }}
          >
            {model.primary}
          </TrmnlText>

          {model.secondary ? (
            <TrmnlText
              variant="description"
              color="ink"
              numberOfLines={2}
              style={{
                width: "100%",
                textAlign: "center",
                fontSize: HERO_CELEBRATION_BODY_SIZE,
                lineHeight: HERO_CELEBRATION_BODY_LINE_HEIGHT,
                paddingHorizontal: 8,
              }}
            >
              {model.secondary}
            </TrmnlText>
          ) : null}

          {model.footnote ? (
            <TrmnlText
              variant="description"
              color="ink"
              numberOfLines={2}
              style={{
                width: "100%",
                textAlign: "center",
                fontSize: HERO_CELEBRATION_BODY_SIZE,
                lineHeight: HERO_CELEBRATION_BODY_LINE_HEIGHT,
                paddingHorizontal: 8,
              }}
            >
              {model.footnote}
            </TrmnlText>
          ) : null}
        </View>
      </Animated.View>
    );
  }

  if (isArrivedVerify) {
    return (
      <Animated.View
        entering={heroFocusEntering(reduceMotion)}
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 2,
          // Lift the focal stack — secondary copy is pinned to the body floor.
          paddingBottom: 28,
        }}
      >
        <View
          style={{
            width: "100%",
            alignItems: "center",
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
              <HeroHalftoneProgress progressRatio={progressFill} />
            </View>
          ) : null}
        </View>

        {model.secondary ? (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: 2,
            }}
          >
            <BodyLine>{model.secondary}</BodyLine>
          </View>
        ) : null}
      </Animated.View>
    );
  }

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

        {contextLines}
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
  const isWaiting = model.phase === "waiting";

  const content = (
    <View style={{ flex: 1, minHeight: 0 }}>
      <HeroCardHeader
        key={`${motionKey}-header`}
        sessionTitle={isWaiting ? (model.secondary ?? "") : ""}
        metaLeft={{ label: model.kindLabel }}
        metaRight={{ label: model.statusLabel }}
        compact={!isWaiting}
        reduceMotion={reduceMotion}
        verifyPulse={showVerifyingPulse}
      />
      <View style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <HeroDisplayBody
          key={motionKey}
          model={model}
          reduceMotion={reduceMotion}
          onFootnotePress={onFootnotePress}
        />
        {isWaiting ? (
          <WaitingContextFooter model={model} onFootnotePress={onFootnotePress} />
        ) : null}
      </View>
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
