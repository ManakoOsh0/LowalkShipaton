/**
 * HeroActivityLocation — Framework label + description pair.
 */
import { View } from "react-native";

import { TrmnlDescription } from "@/components/trmnl/TrmnlDescription";
import { TrmnlLabel } from "@/components/trmnl/TrmnlLabel";
import { TRMNL_GAP } from "@/lib/trmnlFramework";

type HeroActivityLocationProps = {
  activityLabel: string;
  locationLabel: string;
};

export function HeroActivityLocation({
  activityLabel,
  locationLabel,
}: HeroActivityLocationProps) {
  if (!activityLabel.trim() && !locationLabel.trim()) return null;

  return (
    <View style={{ alignItems: "center", gap: TRMNL_GAP.xsmall, maxWidth: "100%" }}>
      {activityLabel.trim() ? (
        <TrmnlLabel size="base">{activityLabel}</TrmnlLabel>
      ) : null}
      {locationLabel.trim() ? (
        <TrmnlDescription size="base" muted={false}>
          {locationLabel}
        </TrmnlDescription>
      ) : null}
    </View>
  );
}
