/**
 * ScreenHeader — shared stack navigation chrome (back, title, optional subtitle + trailing action).
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import { Text, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_SM } from "@/lib/cardStyle";
import { SCREEN_PADDING } from "@/lib/layout";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  trailing,
}: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: subtitle ? "flex-start" : "center",
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 8,
        paddingBottom: subtitle ? 12 : 16,
        gap: 12,
      }}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={handleBack}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: CARD_RADIUS_SM,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardStroke,
          borderCurve: "continuous",
          marginTop: subtitle ? 2 : 0,
        }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.foreground} />
      </PressableScale>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={textStyle("h3", colors.foreground, {
            fontFamily: FONT_FAMILY.bold,
          })}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={textStyle("bodySm", colors.muted, { marginTop: 2 })}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ? <View style={{ marginTop: subtitle ? 2 : 0 }}>{trailing}</View> : null}
    </View>
  );
}
