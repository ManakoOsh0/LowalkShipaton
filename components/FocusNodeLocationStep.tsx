/**
 * Step 2 of Focus Node create/edit — venue selection only.
 */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { PlacePicker } from "@/components/PlacePicker";
import { defaultRadiusForKind, presetIdForKind } from "@/lib/geo";
import type { ThemeColors } from "@/theme/tokens";
import type { Anchor } from "@/types/anchor";
import type { FocusNodeKind } from "@/types/focusNode";
import type { PlaceSelection } from "@/types/place";

function placeFieldCopy(kind: FocusNodeKind): { label: string; emptyHint: string } {
  switch (kind) {
    case "gym":
      return {
        label: "Gym venue",
        emptyHint: "Search for a gym (e.g. Virgin Active Hatfield)",
      };
    case "library":
      return {
        label: "Library venue",
        emptyHint: "Search for a library (e.g. Merensky Library)",
      };
    case "class":
      return {
        label: "Building / campus place",
        emptyHint: "Search for a building (e.g. IT Building)",
      };
    default:
      return {
        label: "Place",
        emptyHint: "Search for a place on the map",
      };
  }
}

type FocusNodeLocationStepProps = {
  kind: FocusNodeKind;
  summaryLine: string;
  selectedAnchor: Anchor | null;
  selectedPlace: PlaceSelection | null;
  anchors: Anchor[];
  selectedAnchorId: string | null;
  onSelectAnchor: (anchor: Anchor) => void;
  onPlaceSelected: (place: PlaceSelection, anchorId: string) => void;
  colors: ThemeColors;
};

export function FocusNodeLocationStep({
  kind,
  summaryLine,
  selectedAnchor,
  selectedPlace,
  anchors,
  selectedAnchorId,
  onSelectAnchor,
  onPlaceSelected,
  colors,
}: FocusNodeLocationStepProps) {
  const [placePickerVisible, setPlacePickerVisible] = useState(false);
  const placeCopy = placeFieldCopy(kind);

  const usableAnchors = anchors.filter(
    (anchor) => !(anchor.latitude === 0 && anchor.longitude === 0),
  );

  return (
    <View style={{ gap: 16 }}>
      {summaryLine ? (
        <View
          style={{
            borderRadius: 14,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            {summaryLine}
          </Text>
        </View>
      ) : null}

      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        {placeCopy.label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={placeCopy.label}
        onPress={() => setPlacePickerVisible(true)}
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{
            fontFamily: selectedAnchor ? "Poppins-SemiBold" : "Poppins-Regular",
            fontSize: 15,
            color: selectedAnchor ? colors.foreground : colors.muted,
          }}
        >
          {selectedAnchor?.name ?? placeCopy.emptyHint}
        </Text>
        {selectedAnchor?.formattedAddress ? (
          <Text
            style={{
              marginTop: 4,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              color: colors.muted,
            }}
          >
            {selectedAnchor.formattedAddress}
          </Text>
        ) : null}
      </Pressable>

      {usableAnchors.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            Recent places
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {usableAnchors.map((anchor) => {
              const selected = selectedAnchorId === anchor.id;
              return (
                <Pressable
                  key={anchor.id}
                  onPress={() => onSelectAnchor(anchor)}
                  style={{
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: selected ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 12,
                      color: selected ? "#F0EDE9" : colors.foreground,
                    }}
                  >
                    {anchor.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <PlacePicker
        visible={placePickerVisible}
        initialPlace={selectedPlace}
        radiusMeters={defaultRadiusForKind(kind)}
        suggestedPresetId={presetIdForKind(kind)}
        searchHint={placeCopy.emptyHint}
        onClose={() => setPlacePickerVisible(false)}
        onSelect={(place, anchorId) => {
          onPlaceSelected(place, anchorId);
          setPlacePickerVisible(false);
        }}
      />
    </View>
  );
}
