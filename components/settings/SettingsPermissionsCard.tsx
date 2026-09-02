/**
 * SettingsPermissionsCard — recovery checklist for OS grants skipped or revoked.
 * Hidden when everything is already allowed; only missing rows are shown.
 */
import { Pressable, Text, View } from "react-native";

import { FormSectionCard } from "@/components/form/FormSectionCard";
import { useRequiredPermissions } from "@/hooks/useRequiredPermissions";
import { useThemeColors } from "@/hooks/useThemeColors";
import { requestOrOpenPermission } from "@/lib/requiredPermissions";

export function SettingsPermissionsCard() {
  const colors = useThemeColors();
  const { checks, ready, refresh } = useRequiredPermissions();
  const needed = checks.filter((check) => check.applicable && !check.granted);

  if (!ready || needed.length === 0) return null;

  const onPressRow = async (id: (typeof needed)[number]["id"]) => {
    await requestOrOpenPermission(id);
    await refresh();
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <FormSectionCard
        title="Permissions"
        footer={
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 12,
              lineHeight: 17,
              color: colors.muted,
            }}
          >
            Location, shielding, and widgets need these turned on. After changing a
            system setting, return to Lowalk and this list will update.
          </Text>
        }
      >
        {needed.map((check, index) => (
          <Pressable
            key={check.id}
            accessibilityRole="button"
            accessibilityLabel={`${check.title}, needed`}
            onPress={() => {
              void onPressRow(check.id);
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: index < needed.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              gap: 12,
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Text
              style={{
                flex: 1,
                fontFamily: "Poppins-SemiBold",
                fontSize: 16,
                lineHeight: 22,
                color: colors.foreground,
              }}
            >
              {check.title}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 13,
                lineHeight: 18,
                color: colors.primary,
              }}
            >
              Needed
            </Text>
          </Pressable>
        ))}
      </FormSectionCard>
    </View>
  );
}
