/** Material 3 collapsed notification limits (prevents OEM truncation). */
export const NOTIFICATION_TITLE_MAX = 29;
export const NOTIFICATION_BODY_EXPANDED_MAX = 80;

export function fitNotificationTitle(title: string, maxLen = NOTIFICATION_TITLE_MAX): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
}

export function fitNotificationBody(body: string, maxLen = NOTIFICATION_BODY_EXPANDED_MAX): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
}
