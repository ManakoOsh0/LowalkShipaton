/**
 * Dev stack — gated hub for UI previews and field-test diagnostics.
 */
import { Redirect, Stack } from "expo-router";

import { isDevToolsHubEnabled } from "@/lib/devToolsAccess";
import { ROUTES } from "@/lib/routes";
import { colors } from "@/theme/tokens";

export default function DevLayout() {
  if (!isDevToolsHubEnabled()) {
    return <Redirect href={ROUTES.home} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
