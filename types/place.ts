/** Venue selection from free native geocoding — stored on Anchor at Focus Node creation. */

export type PlaceSelection = {
  /** Stable local id: geo:{lat},{lng}:{name} or deferred:{name}. */
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  /**
   * True when saved at home without map coords — pin/GPS set on first arrival.
   * Never use the user's home GPS for this.
   */
  deferred?: boolean;
};

export type PlaceSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  latitude: number;
  longitude: number;
};
