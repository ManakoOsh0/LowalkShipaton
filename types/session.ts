/** Session lifecycle states surfaced by the Hero Card on the home dashboard. */

export type SessionScheduleType = "class" | "duration";

export type ActiveSessionSnapshot = {
  nodeId: string;
  zoneLabel: string;
  headline: string;
  nodeTitle: string;
  scheduleType: SessionScheduleType;
  /** When calendar-driven app shielding begins (may be before arrival). */
  shieldStartsAt: string;
  /** Class: fixed scheduled end. Duration: nominal window end — real end is on-site quota. */
  endsAt: string;
  /** Gym/library: milliseconds of verified time inside the geofence. */
  onSiteAccumulatedMs: number;
  /** Last sample timestamp while inside — drives on-site accumulation. */
  onSiteLastTickAt: string | null;
  /** Gym/library: required on-site milliseconds. Null for classes. */
  requiredOnSiteMs: number | null;
  /** ISO when the user left the geofence during an in-venue phase. */
  awaySince: string | null;
  /** Extra app-block window after a presence penalty (classes). */
  penaltyShieldEndsAt: string | null;
  /** Locked minutes applied from Settings when the grace window was missed. */
  penaltyMinutes: number | null;
  /** True once the user has been verified inside the geofence for this session. */
  presenceVerified: boolean;
  /** @deprecated Migrated to awaySince — timer no longer pauses on exit. */
  pausedAt?: string | null;
};
