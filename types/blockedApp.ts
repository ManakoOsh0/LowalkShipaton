/** Local record for a distracting app the user wants shielded during focus sessions. */
export type BlockedApp = {
  id: string;
  /** User-facing label (from package manager or manual fallback). */
  name: string;
  /**
   * Android package name used by the native UsageStats spike.
   * Null for legacy free-text entries until the user re-picks from the installer list.
   */
  packageName: string | null;
  createdAt: string;
};
