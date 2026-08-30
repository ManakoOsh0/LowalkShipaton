/**
 * HeroRouteStrip — tactical day-route for idle hero states.
 * Halftone strip with connected nodes (Culling Games path in TRMNL ink).
 * Hidden when only one session today; active state keeps text-only position.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Line,
  Pattern,
  Rect,
} from "react-native-svg";

import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useHeroTheme } from "@/hooks/useHeroTheme";
import { HERO_MOTION } from "@/lib/heroMotion";
import { HERO_ZONE_DAY_ARC_HEIGHT } from "@/lib/heroEink";
import type { HeroDayArc as HeroDayArcData } from "@/types/dashboard";

type HeroRouteStripProps = {
  dayArc: HeroDayArcData;
};

const STRIP_HEIGHT = HERO_ZONE_DAY_ARC_HEIGHT;
const HORIZONTAL_PADDING = 14;
const MARKER_SIZE = 6;
const CURRENT_MARKER_SIZE = 7;

type NodePoint = { x: number; y: number };

function buildNodePoints(count: number, width: number): NodePoint[] {
  if (count <= 0 || width <= 0) return [];

  const usable = width - HORIZONTAL_PADDING * 2;
  const centerY = STRIP_HEIGHT / 2;

  if (count === 1) {
    return [{ x: width / 2, y: centerY }];
  }

  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const wave = Math.sin(index * 1.15 + 0.4) * 3.5;
    return {
      x: HORIZONTAL_PADDING + t * usable,
      y: centerY + wave,
    };
  });
}

function segmentStroke(
  fromStatus: HeroDayArcData["markers"][number]["status"],
  theme: { textPrimary: string; accent: string; muted: string },
): { color: string; dash: string | undefined; width: number } {
  if (fromStatus === "done") {
    return { color: theme.textPrimary, dash: undefined, width: 1.5 };
  }
  if (fromStatus === "current") {
    return { color: theme.accent, dash: "3 3", width: 1.5 };
  }
  return { color: theme.muted, dash: "2 4", width: 1 };
}

function RouteMarker({
  status,
  x,
  y,
  size,
}: {
  status: HeroDayArcData["markers"][number]["status"];
  x: number;
  y: number;
  size: number;
}) {
  const theme = useHeroTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const prevStatusRef = useRef(status);
  const filled = status === "done" || status === "current";
  const fillColor =
    status === "current" ? theme.accent : theme.textPrimary;
  const strokeColor = theme.textPrimary;
  const opacity =
    status === "upcoming" ? 0.4 : status === "skipped" ? 0.25 : 1;
  const radius = size / 2;

  useEffect(() => {
    if (
      status === "current" &&
      prevStatusRef.current !== "current" &&
      !reduceMotion
    ) {
      scale.value = withSequence(
        withSpring(1.4, HERO_MOTION.markerSpring),
        withSpring(1, HERO_MOTION.markerSpring),
      );
    }
    prevStatusRef.current = status;
  }, [reduceMotion, scale, status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: x - radius,
          top: y - radius,
          width: size,
          height: size,
          opacity,
        },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size}>
        {filled ? (
          <Circle
            cx={radius}
            cy={radius}
            r={radius}
            fill={fillColor}
          />
        ) : (
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 0.75}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={1}
          />
        )}
      </Svg>
    </Animated.View>
  );
}

export function HeroRouteStrip({ dayArc }: HeroRouteStripProps) {
  const theme = useHeroTheme();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const markerCount = dayArc.markers.length;

  const points = useMemo(
    () => buildNodePoints(markerCount, layoutWidth),
    [layoutWidth, markerCount],
  );

  if (markerCount <= 1) return null;

  const markerSize =
    markerCount > 5 ? MARKER_SIZE - 1 : MARKER_SIZE;
  const currentMarkerSize =
    markerCount > 5 ? CURRENT_MARKER_SIZE - 1 : CURRENT_MARKER_SIZE;

  return (
    <View
      accessibilityLabel={dayArc.positionLabel}
      style={{ flex: 1, justifyContent: "center", gap: 2 }}
    >
      <TrmnlText
        variant="labelSmall"
        color="mutedWell"
        numberOfLines={1}
        style={{ textAlign: "center" }}
      >
        {dayArc.positionLabel}
      </TrmnlText>

      <View
        style={{ height: STRIP_HEIGHT, width: "100%" }}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0 && nextWidth !== layoutWidth) {
            setLayoutWidth(nextWidth);
          }
        }}
      >
        {layoutWidth > 0 ? (
          <>
            <Svg
              width={layoutWidth}
              height={STRIP_HEIGHT}
              style={{ position: "absolute", left: 0, top: 0 }}
              pointerEvents="none"
            >
              <Defs>
                <Pattern
                  id="heroRouteHalftone"
                  patternUnits="userSpaceOnUse"
                  width={4}
                  height={4}
                >
                  <Circle cx={1} cy={1} r={0.6} fill={theme.textPrimary} fillOpacity={0.07} />
                </Pattern>
              </Defs>
              <Rect
                x={HORIZONTAL_PADDING - 4}
                y={2}
                width={layoutWidth - (HORIZONTAL_PADDING - 4) * 2}
                height={STRIP_HEIGHT - 4}
                rx={4}
                fill="url(#heroRouteHalftone)"
              />
              {points.length > 1
                ? points.slice(0, -1).map((from, index) => {
                    const to = points[index + 1];
                    const fromStatus = dayArc.markers[index]?.status ?? "upcoming";
                    const stroke = segmentStroke(fromStatus, theme);
                    return (
                      <Line
                        key={`seg-${index}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={stroke.color}
                        strokeWidth={stroke.width}
                        strokeDasharray={stroke.dash}
                        strokeLinecap="round"
                      />
                    );
                  })
                : null}
            </Svg>

            {points.map((point, index) => {
              const status = dayArc.markers[index]?.status ?? "upcoming";
              const size =
                status === "current" ? currentMarkerSize : markerSize;
              return (
                <RouteMarker
                  key={`node-${index}`}
                  status={status}
                  x={point.x}
                  y={point.y}
                  size={size}
                />
              );
            })}
          </>
        ) : null}
      </View>
    </View>
  );
}
