/**
 * Developer tools hub — UI previews, test data, and field-test diagnostics.
 */
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DevToolsScreenContent } from "@/components/dev/DevToolsScreenContent";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useThemeColors } from "@/hooks/useThemeColors";
import { SCREEN_PADDING } from "@/lib/layout";

export default function DevToolsScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScreenHeader title="Developer tools" subtitle="Previews, test data, diagnostics" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <DevToolsScreenContent />
      </ScrollView>
    </SafeAreaView>
  );
}
