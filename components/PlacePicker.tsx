/**
 * PlacePicker — full-screen modal wrapper around PlaceSearchCore for legacy flows.
 */
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlaceSearchCore } from "@/components/PlaceSearchCore";
import { useModalAnimationType } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { AnchorRadiusPresetId } from "@/lib/geo";
import type { PlaceSelection } from "@/types/place";

type PlacePickerProps = {
  visible: boolean;
  initialPlace: PlaceSelection | null;
  radiusMeters: number;
  suggestedPresetId?: AnchorRadiusPresetId;
  searchHint?: string;
  onClose: () => void;
  onSelect: (place: PlaceSelection, anchorId: string) => void;
};

export function PlacePicker({
  visible,
  initialPlace,
  radiusMeters,
  suggestedPresetId,
  searchHint = "e.g. Virgin Active Hatfield",
  onClose,
  onSelect,
}: PlacePickerProps) {
  const colors = useThemeColors();
  const modalAnimationType = useModalAnimationType("slide");
  const [pendingPlace, setPendingPlace] = useState<PlaceSelection | null>(null);

  useEffect(() => {
    if (!visible) {
      setPendingPlace(null);
    }
  }, [visible]);

  const isAdjustingGeofence = Boolean(pendingPlace && !pendingPlace.deferred);

  return (
    <Modal visible={visible} animationType={modalAnimationType} presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 20,
              color: colors.foreground,
            }}
          >
            {isAdjustingGeofence ? "Adjust geofence" : "Choose a place"}
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
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
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}>
          {!isAdjustingGeofence ? (
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 14,
                lineHeight: 20,
                color: colors.muted,
              }}
            >
              Search for a real venue while you plan at home. If search fails, drop a pin on
              the venue map — never use your home GPS.
            </Text>
          ) : null}

          <PlaceSearchCore
            initialPlace={initialPlace}
            radiusMeters={radiusMeters}
            suggestedPresetId={suggestedPresetId}
            searchHint={searchHint}
            onPendingPlaceChange={setPendingPlace}
            onSelect={(place, anchorId) => {
              onSelect(place, anchorId);
              onClose();
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
