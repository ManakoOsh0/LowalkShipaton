/**
 * HeroTacticalInset — Shibuya-style geofence map for walking / verifying hero states.
 * Halftone grid, zone circle, YOU vs venue pins; abstract scale, not turn-by-turn.
 */
import { useId, useMemo, useState } from "react";
import { View } from "react-native";
import Svg, {
    Circle,
    ClipPath,
    Defs,
    G,
    Line,
    Pattern,
    Rect,
} from "react-native-svg";

import { HeroVerifyingPulse } from "@/components/hero/HeroVerifyingPulse";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { TRMNL_THEME } from "@/lib/heroEink";
import type { HeroTacticalInset as HeroTacticalInsetData } from "@/types/dashboard";

type HeroTacticalInsetProps = {
  inset: HeroTacticalInsetData;
};

const INSET_HEIGHT = 54;
const ZONE_CIRCLE_R = 22;
const PIN_ANGLE = Math.PI * 0.78;
const GRID_STEP = 11;

type Point = { x: number; y: number };

function computeZoneCenter(width: number): Point {
  return { x: width / 2, y: INSET_HEIGHT / 2 };
}

function computeUserPin(
  width: number,
  inset: HeroTacticalInsetData,
): Point | null {
  if (!inset.hasUserPosition && inset.locationUnavailable) return null;

  const center = computeZoneCenter(width);
  const scale = ZONE_CIRCLE_R / inset.radiusMeters;
  const maxRadius = Math.min(width, INSET_HEIGHT) / 2 - 12;
  const pixelDist = Math.min(
    inset.distanceFromCenterMeters * scale,
    maxRadius,
  );

  return {
    x: center.x + Math.cos(PIN_ANGLE) * pixelDist,
    y: center.y + Math.sin(PIN_ANGLE) * pixelDist,
  };
}

function TacticalPin({
  label,
  inverted,
  x,
  y,
}: {
  label: string;
  inverted: boolean;
  x: number;
  y: number;
}) {
  const width = label.length * 5.5 + 10;
  const height = 14;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - height / 2,
        minWidth: width,
        height,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 2,
        backgroundColor: inverted ? TRMNL_THEME.paper : TRMNL_THEME.textPrimary,
        borderWidth: 1,
        borderColor: TRMNL_THEME.textPrimary,
      }}
    >
      <TrmnlText
        variant="labelSmall"
        color={inverted ? "ink" : "inverse"}
        numberOfLines={1}
        style={{ fontSize: 8, lineHeight: 10 }}
      >
        {label}
      </TrmnlText>
    </View>
  );
}

function TacticalGrid({
  width,
  patternId,
}: {
  width: number;
  patternId: string;
}) {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  for (let x = 0; x <= width; x += GRID_STEP) {
    lines.push({ x1: x, y1: 0, x2: x, y2: INSET_HEIGHT });
  }
  for (let y = 0; y <= INSET_HEIGHT; y += GRID_STEP) {
    lines.push({ x1: 0, y1: y, x2: width, y2: y });
  }

  return (
    <Svg
      width={width}
      height={INSET_HEIGHT}
      style={{ position: "absolute", left: 0, top: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={3}
          height={3}
        >
          <Circle cx={1} cy={1} r={0.55} fill="rgba(0,0,0,0.09)" />
        </Pattern>
      </Defs>
      {lines.map((line, index) => (
        <Line
          key={`grid-${index}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={0.75}
        />
      ))}
    </Svg>
  );
}

function ZoneOverlay({
  width,
  inset,
  patternId,
  clipId,
}: {
  width: number;
  inset: HeroTacticalInsetData;
  patternId: string;
  clipId: string;
}) {
  const center = computeZoneCenter(width);
  const isVerifying = inset.mode === "verifying";
  const strokeColor = isVerifying ? TRMNL_THEME.accent : TRMNL_THEME.textPrimary;

  const circle = (
    <Svg
      width={width}
      height={INSET_HEIGHT}
      style={{ position: "absolute", left: 0, top: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={3}
          height={3}
        >
          <Circle cx={1} cy={1} r={0.55} fill="rgba(0,0,0,0.11)" />
        </Pattern>
        <ClipPath id={clipId}>
          <Circle cx={center.x} cy={center.y} r={ZONE_CIRCLE_R} />
        </ClipPath>
      </Defs>
      <Circle
        cx={center.x}
        cy={center.y}
        r={ZONE_CIRCLE_R}
        fill="transparent"
        stroke={strokeColor}
        strokeWidth={isVerifying ? 1.75 : 1.25}
        strokeDasharray={isVerifying ? undefined : "4 3"}
      />
      <G clipPath={`url(#${clipId})`}>
        <Rect
          x={center.x - ZONE_CIRCLE_R}
          y={center.y - ZONE_CIRCLE_R}
          width={ZONE_CIRCLE_R * 2}
          height={ZONE_CIRCLE_R * 2}
          fill={`url(#${patternId})`}
        />
      </G>
    </Svg>
  );

  if (isVerifying) {
    return <HeroVerifyingPulse active>{circle}</HeroVerifyingPulse>;
  }

  return circle;
}

export function HeroTacticalInset({ inset }: HeroTacticalInsetProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const patternId = useId().replace(/:/g, "");
  const zonePatternId = `${patternId}-zone`;
  const clipId = `${patternId}-clip`;

  const userPin = useMemo(
    () => (layoutWidth > 0 ? computeUserPin(layoutWidth, inset) : null),
    [layoutWidth, inset],
  );
  const zoneCenter = useMemo(
    () => (layoutWidth > 0 ? computeZoneCenter(layoutWidth) : null),
    [layoutWidth],
  );

  const statusLabel =
    inset.mode === "verifying"
      ? `VERIFY · ${inset.radiusMeters}M`
      : inset.hasUserPosition
        ? `EN ROUTE · ${inset.radiusMeters}M ZONE`
        : inset.locationUnavailable
          ? "ENABLE GPS"
          : `${inset.radiusMeters}M ZONE`;

  return (
    <View
      accessibilityLabel={statusLabel}
      style={{ gap: 2, paddingVertical: 0 }}
    >
      <View
        style={{
          height: INSET_HEIGHT,
          width: "100%",
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0 && nextWidth !== layoutWidth) {
            setLayoutWidth(nextWidth);
          }
        }}
      >
        {layoutWidth > 0 ? (
          <>
            <TacticalGrid width={layoutWidth} patternId={patternId} />
            <ZoneOverlay
              width={layoutWidth}
              inset={inset}
              patternId={zonePatternId}
              clipId={clipId}
            />
            {zoneCenter ? (
              <TacticalPin
                label={inset.venueShortLabel}
                inverted={false}
                x={zoneCenter.x}
                y={zoneCenter.y}
              />
            ) : null}
            {userPin ? (
              <TacticalPin label="YOU" inverted x={userPin.x} y={userPin.y} />
            ) : null}
          </>
        ) : null}
      </View>

      <TrmnlText
        variant="labelSmall"
        color="mutedWell"
        numberOfLines={1}
        style={{ textAlign: "center" }}
      >
        {statusLabel}
      </TrmnlText>
    </View>
  );
}
