/**
 * PRO badge overlay for locked widget previews — mirrors native home-screen gate UI.
 */
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type WidgetPaywallOverlayProps = {
  locked: boolean;
  onUnlockPress: () => void;
  /** Match widget tile corner radius (see WIDGET_*_SPEC.cornerRadiusDp). */
  cornerRadius?: number;
  children: ReactNode;
};

export function WidgetPaywallOverlay({
  locked,
  onUnlockPress,
  cornerRadius = 16,
  children,
}: WidgetPaywallOverlayProps) {
  const colors = useThemeColors();

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Unlock home screen widgets with Lowalk Pro"
      onPress={onUnlockPress}
      style={{
        position: "relative",
        borderRadius: cornerRadius,
        overflow: "hidden",
      }}
    >
      {children}

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(242, 242, 247, 0.72)",
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(20, 18, 16, 0.22)",
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.primaryDeep,
            borderRadius: 6,
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 13,
              lineHeight: 16,
              letterSpacing: 1.2,
              color: colors.background,
            }}
          >
            PRO
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
