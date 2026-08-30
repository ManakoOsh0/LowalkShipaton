/**
 * SettingsSupportCard — feedback, privacy policy, and about rows.
 */
import { useState } from "react";
import { View } from "react-native";

import { FormSectionCard } from "@/components/form/FormSectionCard";
import { AboutSheet } from "@/components/settings/AboutSheet";
import { SettingsListRow } from "@/components/settings/SettingsListRow";
import { FEEDBACK_MAILTO, PRIVACY_POLICY_URL } from "@/constants/appLinks";
import { getAppVersionLabel } from "@/lib/appVersion";
import { openInAppBrowser, openUrl } from "@/lib/openExternal";

export function SettingsSupportCard() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <View style={{ marginBottom: 24 }}>
      <FormSectionCard title="Support">
        <SettingsListRow
          icon="chatbubble-ellipses-outline"
          label="Send feedback"
          onPress={() => void openUrl(FEEDBACK_MAILTO, "Could not open mail")}
          showDivider
        />
        <SettingsListRow
          icon="shield-checkmark-outline"
          label="Privacy policy"
          onPress={() => void openInAppBrowser(PRIVACY_POLICY_URL)}
          showDivider
        />
        <SettingsListRow
          icon="information-circle-outline"
          label="About"
          value={`v${getAppVersionLabel()}`}
          onPress={() => setAboutOpen(true)}
        />
      </FormSectionCard>

      <AboutSheet visible={aboutOpen} onClose={() => setAboutOpen(false)} />
    </View>
  );
}
