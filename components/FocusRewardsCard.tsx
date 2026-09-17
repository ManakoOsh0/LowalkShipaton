/**
 * FocusRewardsCard — Focus Coins balance and My Lowalk Rules in one grouped card.
 */
import { useState } from "react";
import { Text, View } from "react-native";

import { FormSectionCard } from "@/components/form/FormSectionCard";
import { FocusCoinsInfoSheet } from "@/components/settings/FocusCoinsInfoSheet";
import { LowalkRulePickerSheet } from "@/components/settings/LowalkRulePickerSheet";
import { SettingsListRow } from "@/components/settings/SettingsListRow";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PENALTY_TIER_OPTIONS } from "@/lib/sessionPenalty";
import { CLASS_PRE_BUFFER_OPTIONS } from "@/lib/shieldSchedule";
import { useUserStore } from "@/store/useUserStore";

type ActivePicker = "penalty" | "prelock" | null;

export function FocusRewardsCard() {
  const colors = useThemeColors();
  const coins = useUserStore((state) => state.coins);
  const penaltyTierMinutes = useUserStore((state) => state.penaltyTierMinutes);
  const setPenaltyTierMinutes = useUserStore((state) => state.setPenaltyTierMinutes);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const setClassPreBufferMinutes = useUserStore((state) => state.setClassPreBufferMinutes);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [coinsInfoVisible, setCoinsInfoVisible] = useState(false);

  const penaltyLabel =
    PENALTY_TIER_OPTIONS.find((option) => option.minutes === penaltyTierMinutes)?.label ??
    `${penaltyTierMinutes} min`;
  const preLockLabel =
    CLASS_PRE_BUFFER_OPTIONS.find((option) => option.minutes === classPreBufferMinutes)?.label ??
    `${classPreBufferMinutes} min`;

  return (
    <View style={{ marginBottom: 24 }}>
      <FormSectionCard>
        <SettingsListRow
          icon="sparkles-outline"
          label="Focus Coins"
          value={String(coins)}
          onPress={() => setCoinsInfoVisible(true)}
          showDivider
          accessibilityLabel={`${coins} Focus Coins saved. Learn how Focus Coins work.`}
        />

        <Text
          style={{
            marginTop: 4,
            marginBottom: 2,
            fontFamily: "Poppins-SemiBold",
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.muted,
          }}
        >
          My Lowalk Rules
        </Text>

        <SettingsListRow
          icon="lock-closed-outline"
          label="Class penalty"
          value={penaltyLabel}
          onPress={() => setActivePicker("penalty")}
          showDivider
        />
        <SettingsListRow
          icon="alarm-outline"
          label="Session pre-lock"
          value={preLockLabel}
          onPress={() => setActivePicker("prelock")}
        />
      </FormSectionCard>

      <FocusCoinsInfoSheet
        visible={coinsInfoVisible}
        coins={coins}
        onClose={() => setCoinsInfoVisible(false)}
      />

      <LowalkRulePickerSheet
        visible={activePicker === "penalty"}
        title="Class penalty"
        description="Leave a class for more than 5 minutes, or miss it, and apps stay locked for this long. Gym and library stay locked until you finish on site, or midnight."
        options={PENALTY_TIER_OPTIONS.map((option) => ({
          value: option.minutes,
          label: option.label,
        }))}
        selected={penaltyTierMinutes}
        onSelect={setPenaltyTierMinutes}
        onClose={() => setActivePicker(null)}
      />

      <LowalkRulePickerSheet
        visible={activePicker === "prelock"}
        title="Session pre-lock"
        description="Block distracting apps this long before a session starts so you leave on time."
        options={CLASS_PRE_BUFFER_OPTIONS.map((option) => ({
          value: option.minutes,
          label: option.label,
        }))}
        selected={classPreBufferMinutes}
        onSelect={setClassPreBufferMinutes}
        onClose={() => setActivePicker(null)}
      />
    </View>
  );
}
