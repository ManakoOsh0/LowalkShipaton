export type PermissionStepId =
  | "locationForeground"
  | "locationBackground"
  | "notifications"
  | "usageAccess"
  | "overlay"
  | "exactAlarms"
  | "batteryUnrestricted";

export type PermissionCheck = {
  id: PermissionStepId;
  title: string;
  body: string;
  cta: string;
  settingsHint: string | null;
  granted: boolean;
  applicable: boolean;
};

export const PERMISSION_STEP_COPY: Record<
  PermissionStepId,
  Pick<PermissionCheck, "title" | "body" | "cta" | "settingsHint">
> = {
  locationForeground: {
    title: "Stay verified at your venue",
    body: "Lowalk needs location while you use the app so it can confirm you arrived at your Focus Node.",
    cta: "Allow location",
    settingsHint: null,
  },
  locationBackground: {
    title: "Keep checking when you leave",
    body: "Choose Allow all the time so Lowalk can pause or resume your session when you walk away — even if the phone is locked.",
    cta: "Allow all the time",
    settingsHint: "If Android only offers While using the app, open location settings and switch it to Allow all the time, then return here.",
  },
  notifications: {
    title: "Session reminders",
    body: "Allow notifications so Lowalk can remind you before sessions start, alert you when you leave your venue, and celebrate when you hit your daily goal.",
    cta: "Allow notifications",
    settingsHint: null,
  },
  usageAccess: {
    title: "Detect blocked apps",
    body: "Turn on Usage Access for Lowalk so it can detect when you open a blocked app during a focus session.",
    cta: "Open Usage Access settings",
    settingsHint: "Find Lowalk in the list, turn it on, then return here.",
  },
  overlay: {
    title: "Cover blocked apps",
    body: "Allow Display over other apps so Lowalk can show the full-screen focus shield on top of distracting apps.",
    cta: "Open Display over other apps",
    settingsHint: "Turn on the permission for Lowalk, then return here.",
  },
  exactAlarms: {
    title: "Keep widgets and shields on time",
    body: "Allow alarms and reminders so Lowalk can update your home screen widget and start the focus shield at the right moment.",
    cta: "Allow alarms",
    settingsHint: "Turn on Alarms & reminders for Lowalk, then return here.",
  },
  batteryUnrestricted: {
    title: "Let Lowalk run in the background",
    body: "Turn off battery restrictions for Lowalk so location checks and app shielding keep working when the screen is off.",
    cta: "Allow unrestricted battery",
    settingsHint: "Allow Lowalk to ignore battery optimizations, then return here.",
  },
};

export const PERMISSION_STEP_ORDER: PermissionStepId[] = [
  "locationForeground",
  "locationBackground",
  "notifications",
  "usageAccess",
  "overlay",
  "exactAlarms",
  "batteryUnrestricted",
];

export function withPermissionCopy(
  id: PermissionStepId,
  granted: boolean,
  applicable: boolean,
): PermissionCheck {
  return { id, granted, applicable, ...PERMISSION_STEP_COPY[id] };
}

export function selectNextPermissionStep(
  checks: PermissionCheck[],
): PermissionCheck | null {
  return checks.find((check) => check.applicable && !check.granted) ?? null;
}

export function countApplicablePermissions(checks: PermissionCheck[]): {
  granted: number;
  total: number;
} {
  const applicable = checks.filter((check) => check.applicable);
  return {
    granted: applicable.filter((check) => check.granted).length,
    total: applicable.length,
  };
}
