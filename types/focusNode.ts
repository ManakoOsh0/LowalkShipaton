/** Focus Node — an activity profile. Never stores raw GPS coordinates. */

export type FocusNodeKind = "class" | "gym" | "library" | "custom";

/** 0 = Sunday through 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Class nodes use absolute start/end times; gym/library use start + duration. */
export type FocusNodeSchedule =
  | {
      type: "class";
      weekday: Weekday;
      /** 24-hour clock, e.g. "10:00". */
      startTime: string;
      endTime: string;
    }
  | {
      type: "duration";
      weekday: Weekday;
      startTime: string;
      durationHours: number;
    };

export type FocusNode = {
  id: string;
  title: string;
  icon: string;
  kind: FocusNodeKind;
  schedule: FocusNodeSchedule;
  /**
   * Room / venue label for the session (e.g. "IT 4-1").
   * Separate from the Anchor, which is the physical place.
   */
  locationLabel: string | null;
  /** Linked Anchor ID, or null until first-time anchoring completes. */
  anchorId: string | null;
  /** ISO date strings (YYYY-MM-DD) when this node was completed. */
  completedDates: string[];
  /** ISO date strings (YYYY-MM-DD) when the user skipped this occurrence. */
  skippedDates: string[];
  /** ISO date strings when a class miss penalty was applied for this occurrence. */
  missPenaltyDates?: string[];
};

export type FocusNodeInput = Omit<FocusNode, "id" | "completedDates" | "skippedDates" | "missPenaltyDates"> & {
  completedDates?: string[];
  skippedDates?: string[];
  missPenaltyDates?: string[];
};
