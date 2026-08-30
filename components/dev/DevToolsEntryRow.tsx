/**
 * DevToolsEntryRow — Settings link into the /dev hub (preview + Metro builds only).
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import { ROUTES } from "@/lib/routes";

export function DevToolsEntryRow() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Developer
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open developer tools"
        onPress={() => router.push(ROUTES.devTools)}
        style={({ pressed }) => ({
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 15,
              lineHeight: 20,
              color: colors.foreground,
            }}
          >
            Developer tools
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            UI previews, test data, diagnostics
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}
