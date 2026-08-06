import type { ShareMapPosition } from "@/lib/shareOverlayMap";
import type { ShareOverlayHeroStat, ShareOverlayPayload } from "@/types/shareOverlay";

export type ShareOverlayTemplateProps = {
  payload: ShareOverlayPayload;
  heroStat: ShareOverlayHeroStat;
  showVenue: boolean;
  showVerifiedBadge: boolean;
  showWatermark: boolean;
  showConsistencyMap: boolean;
  mapPosition: ShareMapPosition;
  mapInteractive?: boolean;
  onMapPositionChange?: (position: ShareMapPosition) => void;
  width: number;
  height: number;
};
