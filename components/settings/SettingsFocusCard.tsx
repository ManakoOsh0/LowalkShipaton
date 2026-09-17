/**
 * SettingsFocusCard — focus enforcement configuration (blocked apps list).
 */
import { useRouter } from "expo-router";
import { View } from "react-native";

import { FormSectionCard } from "@/components/form/FormSectionCard";
import { SettingsListRow } from "@/components/settings/SettingsListRow";
import { useBlockedAppsHydrated } from "@/hooks/usePersistedStoreHydration";
import { formatBlockedAppsLabel } from "@/lib/heroIntel";
import { ROUTES } from "@/lib/routes";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";

export function SettingsFocusCard() {
  const router = useRouter();
  const appsReady = useBlockedAppsHydrated();
  const blockedCount = useBlockedAppsStore((state) => state.apps.length);
  const value = appsReady ? formatBlockedAppsLabel(blockedCount) : undefined;

  return (
    <View style={{ marginBottom: 24 }}>
      <FormSectionCard title="Focus">
        <SettingsListRow
          icon="shield-outline"
          label="Blocked Apps"
          value={value}
          onPress={() => router.push(ROUTES.blockedApps)}
          accessibilityLabel={value ? `Blocked Apps, ${value}` : "Blocked Apps"}
        />
      </FormSectionCard>
    </View>
  );
}
