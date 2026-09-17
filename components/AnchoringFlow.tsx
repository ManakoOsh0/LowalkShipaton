/**
 * AnchoringFlow — on-site GPS capture and geofence setup.
 * Shared header + step dots persist across hold, nearby-match, and map-adjust steps.
 */
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { AnchorGeofenceEditor } from "@/components/AnchorGeofenceEditor";
import {
  AnchoringSheetHeader,
  AnchoringStepDots,
} from "@/components/AnchoringSheetHeader";
import { BottomSheet } from "@/components/BottomSheet";
import { HoldToConfirmButton } from "@/components/HoldToConfirmButton";
import { SheetActionButton } from "@/components/SheetActionButton";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  clampCoordinatesWithinMeters,
  findNearbyAnchor,
  getOpenStreetMapPreviewUrl,
  haversineDistanceMeters,
  MAX_CALIBRATION_MAP_NUDGE_METERS,
  MAX_PRESENCE_ACCURACY_METERS,
  presetIdForKind,
  validateCalibrationCapture,
  validateCalibrationSave,
  type Coordinates,
} from "@/lib/geo";
import { sheetStepEntering, sheetStepExiting } from "@/lib/heroMotion";
import { CARD_RADIUS_SM } from "@/lib/cardStyle";
import { resetPresenceTimers } from "@/lib/presenceEngine";
import {
  buildArrivalCelebrationPayload,
} from "@/lib/arrivalCelebration";
import { getCurrentPosition } from "@/services/location";
import { useArrivalCelebrationStore } from "@/store/useArrivalCelebrationStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import type { AnchoringSheetMode } from "@/store/useAnchoringSheetStore";
import type { FocusNodeKind } from "@/types/focusNode";

type AnchoringStep = "hold" | "nearby" | "map";

const DEFAULT_RADIUS_METERS = 30;
const NEARBY_MAP_PREVIEW_HEIGHT = 140;

type AnchoringFlowProps = {
  visible: boolean;
  nodeId: string;
  nodeTitle: string;
  anchorId: string;
  anchorName: string;
  mode?: AnchoringSheetMode;
  onComplete: () => void;
};

function formatNearbyDistance(meters: number): string {
  if (meters < 10) return "Right where you're standing";
  const rounded = Math.max(5, Math.round(meters / 5) * 5);
  return `${rounded}m from this spot`;
}

function stepActiveIndex(step: AnchoringStep): number {
  return step === "hold" ? 0 : 1;
}

function celebrateCalibrationArrival(
  nodeId: string,
  nodeTitle: string,
  anchorName: string,
  kind: FocusNodeKind | "study",
): void {
  const session = useScheduleStore.getState().activeSession;
  if (!session || session.nodeId !== nodeId || session.presenceVerified) return;

  useArrivalCelebrationStore.getState().show(
    buildArrivalCelebrationPayload({
      node: {
        id: nodeId,
        title: nodeTitle,
        kind: kind === "study" ? "library" : kind,
      },
      anchorName,
    }),
  );
}

export function AnchoringFlow({
  visible,
  nodeId,
  nodeTitle,
  anchorId,
  anchorName,
  mode = "optional",
  onComplete,
}: AnchoringFlowProps) {
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const calibrateAnchor = useScheduleStore((state) => state.calibrateAnchor);
  const linkNodeToAnchor = useScheduleStore((state) => state.linkNodeToAnchor);

  const [step, setStep] = useState<AnchoringStep>("hold");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [nearbyAnchorId, setNearbyAnchorId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinates | null>(null);
  const [capturedPosition, setCapturedPosition] = useState<Coordinates | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS);
  const [saveError, setSaveError] = useState<string | null>(null);

  const focusNode = useMemo(
    () => focusNodes.find((node) => node.id === nodeId) ?? null,
    [focusNodes, nodeId],
  );

  const suggestedPresetId = useMemo(
    () => presetIdForKind(focusNode?.kind ?? "custom"),
    [focusNode?.kind],
  );

  const nearbyAnchor = nearbyAnchorId
    ? anchors.find((anchor) => anchor.id === nearbyAnchorId) ?? null
    : null;

  const nearbyDistanceLabel = useMemo(() => {
    if (!nearbyAnchor || !mapCenter) return null;
    const meters = haversineDistanceMeters(mapCenter, {
      latitude: nearbyAnchor.latitude,
      longitude: nearbyAnchor.longitude,
    });
    return formatNearbyDistance(meters);
  }, [mapCenter, nearbyAnchor]);

  const isRequired = mode === "required";

  const headerContent = useMemo(() => {
    if (step === "nearby" && nearbyAnchor) {
      return {
        badge: "Nearby place found",
        anchorName: nearbyAnchor.name,
        hintLine: nearbyDistanceLabel
          ? `${nearbyDistanceLabel} — reuse this anchor or set a new spot`
          : "Reuse this anchor or set a new spot",
      };
    }

    if (step === "map") {
      return {
        badge: "Adjust your spot",
        anchorName,
        hintLine: "Drag the pin to your seat, then pick a radius",
      };
    }

    return {
      badge: isRequired ? "Set your anchor" : "Fine-tune location",
      anchorName,
      hintLine: isRequired ? undefined : "We'll use GPS to refine your geofence",
    };
  }, [anchorName, isRequired, nearbyAnchor, nearbyDistanceLabel, step]);

  const resetFlow = () => {
    setStep("hold");
    setIsCapturing(false);
    setIsSaving(false);
    setCaptureError(null);
    setNearbyAnchorId(null);
    setMapCenter(null);
    setCapturedPosition(null);
    setRadiusMeters(DEFAULT_RADIUS_METERS);
    setSaveError(null);
  };

  const handleDismiss = () => {
    resetFlow();
    onComplete();
  };

  const finishAndClose = () => {
    resetFlow();
    onComplete();
  };

  useEffect(() => {
    if (!visible) {
      resetFlow();
    }
  }, [visible]);

  const advanceAfterCapture = (position: Coordinates) => {
    const currentAnchor = anchors.find((anchor) => anchor.id === anchorId);
    if (currentAnchor) {
      const onSiteError = validateCalibrationCapture(currentAnchor, position);
      if (onSiteError) {
        setCaptureError(onSiteError);
        return;
      }
    }

    setCapturedPosition(position);
    setMapCenter(position);
    setSaveError(null);

    const nearby = findNearbyAnchor(anchors, position, undefined, {
      preferPlaceId: currentAnchor?.placeId,
      excludeAnchorId: anchorId,
    });

    if (nearby) {
      setNearbyAnchorId(nearby.id);
      setStep("nearby");
      return;
    }

    setStep("map");
  };

  const handleHoldComplete = async () => {
    setIsCapturing(true);
    setCaptureError(null);

    const result = await getCurrentPosition();
    setIsCapturing(false);

    if (!result.success) {
      setCaptureError(result.error);
      return;
    }

    if (
      result.accuracyMeters != null &&
      result.accuracyMeters > MAX_PRESENCE_ACCURACY_METERS
    ) {
      setCaptureError(
        "GPS is too inaccurate right now. Try again near a window or step outside briefly.",
      );
      return;
    }

    advanceAfterCapture(result.position);
  };

  const handleMapCenterChange = (coords: Coordinates) => {
    if (!capturedPosition) {
      setMapCenter(coords);
      return;
    }
    setMapCenter(
      clampCoordinatesWithinMeters(
        capturedPosition,
        coords,
        MAX_CALIBRATION_MAP_NUDGE_METERS,
      ),
    );
    setSaveError(null);
  };

  const finishCalibration = () => {
    if (!mapCenter || !capturedPosition || isSaving) return;

    const currentAnchor = anchors.find((anchor) => anchor.id === anchorId);
    if (currentAnchor) {
      const validationError = validateCalibrationSave(
        currentAnchor,
        capturedPosition,
        mapCenter,
      );
      if (validationError) {
        setSaveError(validationError);
        return;
      }
    }

    setIsSaving(true);
    setSaveError(null);
    const calibrated = calibrateAnchor(anchorId, {
      latitude: mapCenter.latitude,
      longitude: mapCenter.longitude,
      radiusMeters,
      capturedLatitude: capturedPosition.latitude,
      capturedLongitude: capturedPosition.longitude,
    });
    setIsSaving(false);

    if (!calibrated) {
      setSaveError("Could not save this spot. Move to your venue and try again.");
      return;
    }

    resetPresenceTimers();
    celebrateCalibrationArrival(
      nodeId,
      nodeTitle,
      anchorName,
      focusNode?.kind ?? "custom",
    );
    finishAndClose();
  };

  const handleUseNearbyAnchor = () => {
    if (!nearbyAnchorId || isSaving) return;

    setIsSaving(true);
    const linked = linkNodeToAnchor(nodeId, nearbyAnchorId);
    setIsSaving(false);

    if (linked) {
      resetPresenceTimers();
      celebrateCalibrationArrival(
        nodeId,
        nodeTitle,
        nearbyAnchor?.name ?? anchorName,
        focusNode?.kind ?? "custom",
      );
      finishAndClose();
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleDismiss}
      dismissible={!isRequired}
      dismissOnBackdrop={!isRequired}
      scrollable={step === "map"}
    >
      <View style={{ paddingHorizontal: 4, paddingBottom: 8, gap: 16 }}>
        {!isRequired && step === "hold" ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleDismiss}
            hitSlop={8}
            style={{ alignSelf: "flex-end", marginBottom: -4 }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 15,
                color: colors.primary,
              }}
            >
              Cancel
            </Text>
          </Pressable>
        ) : null}

        <AnchoringSheetHeader
          badge={headerContent.badge}
          anchorName={headerContent.anchorName}
          nodeTitle={nodeTitle}
          hintLine={headerContent.hintLine}
          pulsing={isCapturing}
        />

        <AnchoringStepDots activeIndex={stepActiveIndex(step)} />

        <Animated.View
          key={step}
          entering={sheetStepEntering(reduceMotion)}
          exiting={sheetStepExiting(reduceMotion)}
          style={{ gap: 16 }}
        >
          {step === "hold" ? (
            <>
              <HoldToConfirmButton
                label="Hold to set location"
                onComplete={() => void handleHoldComplete()}
                loading={isCapturing}
                disabled={isCapturing}
              />

              {captureError ? (
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.error,
                    textAlign: "center",
                  }}
                >
                  {captureError}
                </Text>
              ) : null}
            </>
          ) : null}

          {step === "nearby" && nearbyAnchor && mapCenter ? (
            <>
              <View
                style={{
                  height: NEARBY_MAP_PREVIEW_HEIGHT,
                  borderRadius: CARD_RADIUS_SM,
                  borderCurve: "continuous",
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.cardStroke,
                }}
              >
                <Image
                  source={{
                    uri: getOpenStreetMapPreviewUrl(
                      nearbyAnchor.latitude,
                      nearbyAnchor.longitude,
                    ),
                  }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  accessibilityLabel={`Map preview of ${nearbyAnchor.name}`}
                />
              </View>

              <SheetActionButton
                label="Use this place"
                onPress={handleUseNearbyAnchor}
                loading={isSaving}
                disabled={isSaving}
              />

              <SheetActionButton
                label="Set a new spot"
                variant="secondary"
                onPress={() => setStep("map")}
                disabled={isSaving}
              />
            </>
          ) : null}

          {step === "map" && mapCenter ? (
            <>
              <AnchorGeofenceEditor
                latitude={mapCenter.latitude}
                longitude={mapCenter.longitude}
                radiusMeters={radiusMeters}
                anchorName={anchorName}
                suggestedPresetId={suggestedPresetId}
                onCenterChange={handleMapCenterChange}
                onRadiusChange={setRadiusMeters}
              />

              {saveError ? (
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.error,
                    textAlign: "center",
                  }}
                >
                  {saveError}
                </Text>
              ) : null}

              <SheetActionButton
                label="Save anchor"
                onPress={finishCalibration}
                loading={isSaving}
                disabled={isSaving}
              />
            </>
          ) : null}
        </Animated.View>
      </View>
    </BottomSheet>
  );
}
