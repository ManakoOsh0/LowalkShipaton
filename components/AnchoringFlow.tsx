/**
 * Optional calibration — shifts the geofence center to the user's current seat.
 * Presence already works from searched venue coords; this reduces false exits in large buildings.
 */
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColors } from "@/hooks/useThemeColors";
import {
  ANCHOR_RADIUS_PRESETS,
  findNearbyAnchor,
  type Coordinates,
} from "@/lib/geo";
import { getCurrentPosition } from "@/services/location";
import { useScheduleStore } from "@/store/useScheduleStore";

type AnchoringStep = "intro" | "nearby" | "radius" | "custom";

type AnchoringFlowProps = {
  visible: boolean;
  nodeId: string;
  nodeTitle: string;
  anchorId: string;
  anchorName: string;
  /** required = deferred venue first arrival; optional = fine-tune seat alignment. */
  mode?: "required" | "optional";
  onComplete: () => void;
};

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
  const anchors = useScheduleStore((state) => state.anchors);
  const calibrateAnchor = useScheduleStore((state) => state.calibrateAnchor);
  const linkNodeToAnchor = useScheduleStore((state) => state.linkNodeToAnchor);

  const [step, setStep] = useState<AnchoringStep>("intro");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [capturedPosition, setCapturedPosition] = useState<Coordinates | null>(null);
  const [nearbyAnchorId, setNearbyAnchorId] = useState<string | null>(null);
  const [customRadius, setCustomRadius] = useState("35");

  const nearbyAnchor = nearbyAnchorId
    ? anchors.find((anchor) => anchor.id === nearbyAnchorId) ?? null
    : null;

  const resetFlow = () => {
    setStep("intro");
    setIsCapturing(false);
    setCaptureError(null);
    setCapturedPosition(null);
    setNearbyAnchorId(null);
    setCustomRadius("35");
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    setCaptureError(null);

    const result = await getCurrentPosition();
    setIsCapturing(false);

    if (!result.success) {
      setCaptureError(result.error);
      return;
    }

    setCapturedPosition(result.position);
    const currentAnchor = anchors.find((anchor) => anchor.id === anchorId);
    const nearby = findNearbyAnchor(anchors, result.position, undefined, {
      preferPlaceId: currentAnchor?.placeId,
      excludeAnchorId: anchorId,
    });
    if (nearby) {
      setNearbyAnchorId(nearby.id);
      setStep("nearby");
      return;
    }

    setStep("radius");
  };

  const finishCalibration = (radiusMeters: number) => {
    if (!capturedPosition) return;

    const calibrated = calibrateAnchor(anchorId, {
      latitude: capturedPosition.latitude,
      longitude: capturedPosition.longitude,
      radiusMeters,
    });

    if (calibrated) {
      resetFlow();
      onComplete();
    }
  };

  const handleUseNearbyAnchor = () => {
    if (!nearbyAnchorId) return;

    const linked = linkNodeToAnchor(nodeId, nearbyAnchorId);
    if (linked) {
      resetFlow();
      onComplete();
    }
  };

  const handleCreateNewAnchor = () => {
    setNearbyAnchorId(null);
    setStep("radius");
  };

  const handleCustomRadius = () => {
    const parsed = Number(customRadius);
    if (!Number.isFinite(parsed) || parsed < 10 || parsed > 200) {
      setCaptureError("Enter a radius between 10 and 200 meters.");
      return;
    }

    finishCalibration(Math.round(parsed));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: 20,
            paddingTop: 12,
          }}
        >
          {mode === "optional" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                resetFlow();
                onComplete();
              }}
              hitSlop={8}
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
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 22,
              lineHeight: 28,
              color: colors.foreground,
            }}
          >
            {mode === "required" ? "Set your location" : "Align geofence to my seat"}
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontFamily: "Poppins-Regular",
              fontSize: 15,
              lineHeight: 22,
              color: colors.muted,
            }}
          >
            {mode === "required"
              ? `You're at ${anchorName} for ${nodeTitle}. Stand where you spend this session so Lowalk can verify presence.`
              : `Optional fine-tune for ${nodeTitle} at ${anchorName}. Stand where you usually sit so Lowalk does not flag false exits inside a large building.`}
          </Text>

          {step === "intro" && (
            <View style={{ marginTop: 24, gap: 16 }}>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 15,
                  lineHeight: 22,
                  color: colors.foreground,
                }}
              >
                Stand precisely where you spend this session, then capture your current
                position.
              </Text>

              {captureError ? (
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.error,
                  }}
                >
                  {captureError}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => void handleCapture()}
                disabled={isCapturing}
                style={{
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  opacity: isCapturing ? 0.7 : 1,
                }}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#F0EDE9" />
                ) : (
                  <Text
                    style={{
                      fontFamily: "Poppins-Bold",
                      fontSize: 16,
                      color: "#F0EDE9",
                    }}
                  >
                    Capture my location
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {step === "nearby" && nearbyAnchor ? (
            <View style={{ marginTop: 24, gap: 16 }}>
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.foreground,
                }}
              >
                Use existing location?
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 15,
                  lineHeight: 22,
                  color: colors.muted,
                }}
              >
                You are near {nearbyAnchor.name}. Reuse it to avoid mapping the same venue
                twice.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={handleUseNearbyAnchor}
                style={{
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Bold",
                    fontSize: 16,
                    color: "#F0EDE9",
                  }}
                >
                  Use {nearbyAnchor.name}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleCreateNewAnchor}
                style={{
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                >
                  Create a new anchor here
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === "radius" ? (
            <View style={{ marginTop: 24, gap: 12 }}>
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.foreground,
                }}
              >
                How large is this space?
              </Text>

              {ANCHOR_RADIUS_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  accessibilityRole="button"
                  onPress={() => finishCalibration(preset.radiusMeters)}
                  style={{
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 15,
                      color: colors.foreground,
                    }}
                  >
                    {preset.label}
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontFamily: "Poppins-Regular",
                      fontSize: 13,
                      color: colors.muted,
                    }}
                  >
                    {preset.description}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                onPress={() => setStep("custom")}
                style={{
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                >
                  Custom radius
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === "custom" ? (
            <View style={{ marginTop: 24, gap: 12 }}>
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 16,
                  color: colors.foreground,
                }}
              >
                Custom radius (meters)
              </Text>
              <TextInput
                value={customRadius}
                onChangeText={setCustomRadius}
                keyboardType="number-pad"
                placeholder="35"
                placeholderTextColor={colors.muted}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontFamily: "Poppins-Regular",
                  fontSize: 16,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
              />

              {captureError ? (
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 14,
                    color: colors.error,
                  }}
                >
                  {captureError}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleCustomRadius}
                style={{
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Bold",
                    fontSize: 16,
                    color: "#F0EDE9",
                  }}
                >
                  Save anchor
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
