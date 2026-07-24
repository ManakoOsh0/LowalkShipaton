/**
 * Preview / field-test builds set EXPO_PUBLIC_PRESENCE_DEBUG=1 so testers can
 * see background-location diagnostics without a Metro-connected __DEV__ client.
 * Production builds omit the flag so the card stays gated.
 */
export function isPresenceDebugEnabled(): boolean {
  return (
    __DEV__ ||
    process.env.EXPO_PUBLIC_PRESENCE_DEBUG === "1"
  );
}
