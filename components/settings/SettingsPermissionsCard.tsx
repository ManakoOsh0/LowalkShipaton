/**
 * SettingsPermissionsCard — live checklist of OS grants Lowalk needs.
 * Lets the user finish anything skipped during first-run or revoked later.
 */
import { Pressable, Text, View } from "react-native";

import { FormSectionCard } from "@/components/form/FormSectionCard";
import { useRequiredPermissions } from "@/hooks/useRequiredPermissions";
import { useThemeColors } from "@/hooks/useThemeColors";
import { requestOrOpenPermission } from "@/lib/requiredPermissions";

export function SettingsPermissionsCard() {
  const colors = useThemeColors();
  const { checks, ready, progress, refresh } = useRequiredPermissions();
  const visible = checks.filter((check) => check.applicable);

  if (!ready || visible.length === 0) return null;

  const onPressRow = async (id: (typeof visible)[number]["id"], granted: boolean) => {
    if (granted) return;
    await requestOrOpenPermission(id);
    await refresh();
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <FormSectionCard
        title="Permissions"
        footer={
          progress.granted < progress.total ? (
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
          ) : null
        }
      >
        {visible.map((check, index) => (
          <Pressable
            key={check.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: check.granted }}
            accessibilityLabel={`${check.title}, ${check.granted ? "allowed" : "needed"}`}
            disabled={check.granted}
            onPress={() => {
              void onPressRow(check.id, check.granted);
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: index < visible.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              gap: 12,
              opacity: pressed && !check.granted ? 0.72 : 1,
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
                color: check.granted ? colors.success : colors.primary,
              }}
            >
              {check.granted ? "Allowed" : "Needed"}
            </Text>
          </Pressable>
        ))}
      </FormSectionCard>
    </View>
  );
}
