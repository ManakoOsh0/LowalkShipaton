/**
 * TrmnlTitleBar — Framework title_bar strip (compact hero variant).
 */
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { TrmnlDivider } from "@/components/trmnl/TrmnlDivider";

import { useHeroTheme } from "@/hooks/useHeroTheme";
import { heroHeaderEntering } from "@/lib/heroMotion";
import { TRMNL_GAP, TRMNL_TITLE_BAR } from "@/lib/trmnlFramework";

type TrmnlTitleBarProps = {
  title: string;
  instance?: string;
  motionKey?: string;
  reduceMotion?: boolean;
  accessory?: ReactNode;
};

export function TrmnlTitleBar({
  title,
  instance,
  motionKey,
  reduceMotion = false,
  accessory,
}: TrmnlTitleBarProps) {
  const theme = useHeroTheme();

  return (
    <Animated.View
      key={motionKey ? `${motionKey}-title-bar` : undefined}
      entering={heroHeaderEntering(reduceMotion)}
      style={{ width: "100%", gap: TRMNL_GAP.xxsmall }}
    >
      <View
        style={{
          minHeight: TRMNL_TITLE_BAR.height,
          paddingTop: TRMNL_TITLE_BAR.paddingTop,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: TRMNL_GAP.small,
        }}
      >
        {accessory}
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{
            fontFamily: TRMNL_TITLE_BAR.family,
            fontSize: TRMNL_TITLE_BAR.fontSize,
            lineHeight: TRMNL_TITLE_BAR.lineHeight,
            color: theme.textPrimary,
            textTransform: "uppercase",
            letterSpacing: 1.6,
            textAlign: "center",
            flexShrink: 1,
          }}
        >
          {title}
        </Text>
        {instance ? (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              fontFamily: TRMNL_TITLE_BAR.family,
              fontSize: TRMNL_TITLE_BAR.fontSize,
              lineHeight: TRMNL_TITLE_BAR.lineHeight,
              color: theme.mutedOnWell,
              textTransform: "uppercase",
            }}
          >
            {instance}
          </Text>
        ) : null}
      </View>
      <TrmnlDivider />
    </Animated.View>
  );
}
