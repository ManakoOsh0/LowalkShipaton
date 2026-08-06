import { Image } from "expo-image";
import type { ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { View } from "react-native";

import { ShareDraggableConsistencyMap } from "@/components/share/ShareDraggableConsistencyMap";
import { BroadcastTemplate } from "@/components/share/templates/BroadcastTemplate";
import { DayPosterTemplate } from "@/components/share/templates/DayPosterTemplate";
import { EarlyClassTemplate } from "@/components/share/templates/EarlyClassTemplate";
import { GymSessionTemplate } from "@/components/share/templates/GymSessionTemplate";
import { ImessageBubbleTemplate } from "@/components/share/templates/ImessageBubbleTemplate";
import { KnockoutTemplate } from "@/components/share/templates/KnockoutTemplate";
import { LibrarySessionTemplate } from "@/components/share/templates/LibrarySessionTemplate";
import { MinimalVerifiedTemplate } from "@/components/share/templates/MinimalVerifiedTemplate";
import { NeonDurationTemplate } from "@/components/share/templates/NeonDurationTemplate";
import { ReceiptTemplate } from "@/components/share/templates/ReceiptTemplate";
import { StackedSessionsTemplate } from "@/components/share/templates/StackedSessionsTemplate";
import { StatsGridTemplate } from "@/components/share/templates/StatsGridTemplate";
import { StreakHeroTemplate } from "@/components/share/templates/StreakHeroTemplate";
import { TrmnlHudTemplate } from "@/components/share/templates/TrmnlHudTemplate";
import { WeeklyGridTemplate } from "@/components/share/templates/WeeklyGridTemplate";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import type { ShareOverlayTemplateId } from "@/types/shareOverlay";

type ShareOverlayCanvasProps = ShareOverlayTemplateProps & {
  photoUri: string | null;
  /** Bundled asset for dev preview — works without the photo library. */
  photoSource?: ImageSource;
};

function renderTemplate(templateId: ShareOverlayTemplateId, props: ShareOverlayTemplateProps): ReactNode {
  switch (templateId) {
    case "early_class":
      return <EarlyClassTemplate {...props} />;
    case "gym_session":
      return <GymSessionTemplate {...props} />;
    case "library_session":
      return <LibrarySessionTemplate {...props} />;
    case "neon_duration":
      return <NeonDurationTemplate {...props} />;
    case "trmnl_hud":
      return <TrmnlHudTemplate {...props} />;
    case "weekly_grid":
      return <WeeklyGridTemplate {...props} />;
    case "streak_hero":
      return <StreakHeroTemplate {...props} />;
    case "day_poster":
      return <DayPosterTemplate {...props} />;
    case "stats_grid":
      return <StatsGridTemplate {...props} />;
    case "minimal_verified":
      return <MinimalVerifiedTemplate {...props} />;
    case "stacked_sessions":
      return <StackedSessionsTemplate {...props} />;
    case "imessage_bubble":
      return <ImessageBubbleTemplate {...props} />;
    case "receipt":
      return <ReceiptTemplate {...props} />;
    case "knockout":
      return <KnockoutTemplate {...props} />;
    case "broadcast":
      return <BroadcastTemplate {...props} />;
  }
}

/** 9:16 share frame — photo background with template overlay for preview and export. */
export function ShareOverlayCanvas({
  photoUri,
  photoSource,
  templateId,
  showConsistencyMap,
  mapPosition,
  mapInteractive = false,
  onMapPositionChange,
  payload,
  width,
  height,
  ...templateProps
}: ShareOverlayCanvasProps & { templateId: ShareOverlayTemplateId }) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#141210",
      }}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ position: "absolute", width, height }}
          contentFit="cover"
        />
      ) : photoSource ? (
        <Image
          source={photoSource}
          style={{ position: "absolute", width, height }}
          contentFit="cover"
        />
      ) : (
        <LinearGradient
          colors={["#1A1816", "#2A2622", "#141210"]}
          style={{ position: "absolute", width, height }}
        />
      )}

      <View
        style={{
          position: "absolute",
          width,
          height,
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      />

      {renderTemplate(templateId, {
        payload,
        width,
        height,
        showConsistencyMap,
        mapPosition,
        mapInteractive,
        onMapPositionChange,
        ...templateProps,
      })}

      {showConsistencyMap ? (
        <ShareDraggableConsistencyMap
          weeks={payload.contributionWeeks}
          activeDaysLast30={payload.activeDaysLast30}
          canvasWidth={width}
          canvasHeight={height}
          position={mapPosition}
          onPositionChange={onMapPositionChange}
          interactive={mapInteractive}
        />
      ) : null}
    </View>
  );
}
