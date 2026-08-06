import { create } from "zustand";

import {
  defaultHeroStatForContext,
  defaultTemplateForContext,
  shouldShowVenueByDefault,
} from "@/lib/shareOverlay";
import {
  DEFAULT_SHARE_MAP_POSITION,
  type ShareMapPosition,
} from "@/lib/shareOverlayMap";
import type {
  ShareOverlayHeroStat,
  ShareOverlayPayload,
  ShareOverlayTemplateId,
} from "@/types/shareOverlay";

type ShareOverlayOpenOptions = {
  showConsistencyMap?: boolean;
};

type ShareOverlayState = {
  visible: boolean;
  payload: ShareOverlayPayload | null;
  photoUri: string | null;
  templateId: ShareOverlayTemplateId;
  heroStat: ShareOverlayHeroStat;
  showVenue: boolean;
  showVerifiedBadge: boolean;
  showWatermark: boolean;
  showConsistencyMap: boolean;
  mapPosition: ShareMapPosition;
  open: (
    payload: ShareOverlayPayload,
    templateIdOverride?: ShareOverlayTemplateId,
    options?: ShareOverlayOpenOptions,
  ) => void;
  close: () => void;
  setPhotoUri: (uri: string | null) => void;
  setTemplateId: (templateId: ShareOverlayTemplateId) => void;
  setHeroStat: (heroStat: ShareOverlayHeroStat) => void;
  setShowVenue: (showVenue: boolean) => void;
  setShowVerifiedBadge: (showVerifiedBadge: boolean) => void;
  setShowWatermark: (showWatermark: boolean) => void;
  setShowConsistencyMap: (showConsistencyMap: boolean) => void;
  setMapPosition: (mapPosition: ShareMapPosition) => void;
};

/** UI state for the Aura-style share overlay composer modal. */
export const useShareOverlayStore = create<ShareOverlayState>((set) => ({
  visible: false,
  payload: null,
  photoUri: null,
  templateId: "neon_duration",
  heroStat: "duration",
  showVenue: false,
  showVerifiedBadge: true,
  showWatermark: true,
  showConsistencyMap: false,
  mapPosition: DEFAULT_SHARE_MAP_POSITION,
  open: (payload, templateIdOverride, options) =>
    set({
      visible: true,
      payload,
      photoUri: null,
      templateId: templateIdOverride ?? defaultTemplateForContext(payload.context, payload),
      heroStat: defaultHeroStatForContext(payload.context),
      showVenue: shouldShowVenueByDefault(payload.placeLine),
      showVerifiedBadge: payload.presenceVerified,
      showWatermark: true,
      showConsistencyMap: options?.showConsistencyMap ?? false,
      mapPosition: DEFAULT_SHARE_MAP_POSITION,
    }),
  close: () =>
    set({
      visible: false,
      payload: null,
      photoUri: null,
    }),
  setPhotoUri: (photoUri) => set({ photoUri }),
  setTemplateId: (templateId) => set({ templateId }),
  setHeroStat: (heroStat) => set({ heroStat }),
  setShowVenue: (showVenue) => set({ showVenue }),
  setShowVerifiedBadge: (showVerifiedBadge) => set({ showVerifiedBadge }),
  setShowWatermark: (showWatermark) => set({ showWatermark }),
  setShowConsistencyMap: (showConsistencyMap) => set({ showConsistencyMap }),
  setMapPosition: (mapPosition) => set({ mapPosition }),
}));
