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
  /** Centers the title between balanced leading/trailing slots (40px). */
  centerTitle?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  centerTitle = false,
  onBack,
  trailing,
}: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const handleBack = onBack ?? (() => router.back());

  const backButton = (
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
  );

  const titleBlock = (
    <>
      <Text
        style={textStyle("h3", colors.foreground, {
          fontFamily: FONT_FAMILY.bold,
          textAlign: centerTitle ? "center" : "left",
        })}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={textStyle("bodySm", colors.muted, {
            marginTop: 2,
            textAlign: centerTitle ? "center" : "left",
          })}
        >
          {subtitle}
        </Text>
      ) : null}
    </>
  );

  if (centerTitle) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: subtitle ? "flex-start" : "center",
          paddingHorizontal: SCREEN_PADDING,
          paddingTop: 8,
          paddingBottom: subtitle ? 12 : 16,
        }}
      >
        <View style={{ width: 40 }}>{backButton}</View>
        <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 8 }}>{titleBlock}</View>
        <View
          style={{
            width: 40,
            alignItems: "flex-end",
            marginTop: subtitle ? 2 : 0,
          }}
        >
          {trailing ?? null}
        </View>
      </View>
    );
  }

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
      {backButton}

      <View style={{ flex: 1, minWidth: 0 }}>{titleBlock}</View>

      {trailing ? <View style={{ marginTop: subtitle ? 2 : 0 }}>{trailing}</View> : null}
    </View>
  );
}
